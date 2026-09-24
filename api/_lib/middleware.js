import { verifyIdToken } from './firebase-admin.js';
import { getCollection, COLLECTIONS } from './mongodb.js';

/**
 * Read ADMIN_EMAILS lazily on every call so a redeploy / env change is
 * picked up without a cold start, and so a space after a comma never
 * breaks admin detection.
 */
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Extract & verify Bearer token. Returns { uid, email, role, isAdmin } or null.
 */
export async function authenticate(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  const decoded = await verifyIdToken(token);
  if (!decoded) return null;

  const adminEmails = getAdminEmails();
  const isAdmin =
    decoded.role === 'admin' ||
    decoded.admin === true ||
    adminEmails.includes((decoded.email || '').toLowerCase());

  return {
    uid: decoded.uid,
    email: decoded.email,
    role: isAdmin ? 'admin' : 'customer',
    isAdmin,
  };
}

export async function requireAuth(req, res) {
  const user = await authenticate(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!user.isAdmin) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return null;
  }
  return user;
}

/**
 * Ensure a user document exists in MongoDB (upsert on first login).
 */
export async function ensureUserDoc(user) {
  if (!user) return null;
  const users = await getCollection(COLLECTIONS.USERS);
  const now = new Date();

  // Don't blindly overwrite the stored role with the Firebase claim — the
  // claim can be stale if an admin was demoted in Mongo. Only set the role
  // on first insert; afterwards, trust the database.
  await users.updateOne(
    { uid: user.uid },
    {
      $set: { email: user.email, lastLoginAt: now },
      $setOnInsert: { createdAt: now, role: user.role, isAdmin: user.isAdmin },
    },
    { upsert: true }
  );

  return users.findOne({ uid: user.uid });
}

/** Simple body parser for Vercel (JSON) */
export function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

/** Standard response helpers */
export function ok(res, data, status = 200) {
  // Always wrap in { success: true, data } — even if data is undefined
  return res.status(status).json({ success: true, data: data === undefined ? null : data });
}

export function fail(res, message, status = 400, code = null) {
  return res.status(status).json({ success: false, error: message, code });
}