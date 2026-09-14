import { requireAuth, ensureUserDoc, ok, fail } from '../_lib/middleware.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

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