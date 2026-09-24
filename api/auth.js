import {
  requireAuth,
  ok,
  fail,
  parseBody,
  ensureUserDoc,
  getPathSegments,
} from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';

/**
 * Router for /api/auth/*
 *  POST /api/auth/verify   → verify token + return profile
 *  GET  /api/auth/profile  → get profile
 *  PUT  /api/auth/profile  → update profile
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'auth');
  const action = segments[0] || ''; // 'verify' | 'profile'
  const method = req.method;

  console.log(
    `[auth] ${method} action=${action || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

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
      const allowed = [
        'displayName',
        'phone',
        'address',
        'city',
        'pincode',
        'photoURL',
      ];
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