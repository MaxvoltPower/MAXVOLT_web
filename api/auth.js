import { requireAuth, ok, fail, parseBody, ensureUserDoc } from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';

/**
 * Router for /api/auth/*
 *  POST /api/auth/verify   → verify token + return profile
 *  GET  /api/auth/profile  → get profile
 *  PUT  /api/auth/profile  → update profile
 *
 * How routing works: Vercel passes `req.query.path` as an array
 * when the catch-all file is at api/auth.js and request is /api/auth/verify
 * If not available, we fall back to parsing req.url.
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'auth');
  const action = segments[0] || '';   // 'verify' | 'profile'
  const method = req.method;

  // ---- POST /api/auth/verify ----
  if (action === 'verify') {
    if (method !== 'POST') return fail(res, 'Method not allowed', 405);
    const user = await requireAuth(req, res);
    if (!user) return;
    const doc = await ensureUserDoc(user);
    return ok(res, {
      uid: user.uid,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      profile: doc,
    });
  }

  // ---- /api/auth/profile ----
  if (action === 'profile') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const users = await getCollection(COLLECTIONS.USERS);

    if (method === 'GET') {
      const doc = await users.findOne({ uid: user.uid });
      return ok(res, doc || {});
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = parseBody(req);
      const allowed = ['displayName', 'phone', 'address', 'city', 'pincode', 'photoURL'];
      const update = {};
      for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
      update.updatedAt = new Date();

      await users.updateOne({ uid: user.uid }, { $set: update }, { upsert: true });
      const doc = await users.findOne({ uid: user.uid });
      return ok(res, doc);
    }

    return fail(res, 'Method not allowed', 405);
  }

  return fail(res, 'Not found', 404);
}

/** Extract path segments after a given prefix, e.g. /api/auth/profile → ['profile'] */
function getPathSegments(req, prefix) {
  // Vercel sometimes exposes req.query.path as array
  if (req.query && req.query.path) {
    return Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  }
  // Fallback: parse from URL
  const url = (req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean); // ['api', 'auth', 'profile']
  const idx = parts.indexOf(prefix);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}