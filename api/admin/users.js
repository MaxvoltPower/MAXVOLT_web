import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { setUserRole, getUserById } from '../_lib/firebase-admin.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const users = await getCollection(COLLECTIONS.USERS);

  if (req.method === 'GET') {
    const { q } = req.query;
    const query = q
      ? { $or: [{ email: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }] }
      : {};
    const items = await users.find(query).sort({ createdAt: -1 }).limit(200).toArray();
    return ok(res, items);
  }

  if (req.method === 'PATCH') {
    const { uid, role } = parseBody(req);
    if (!uid || !role) return fail(res, 'uid and role required');
    if (!['admin', 'customer'].includes(role)) return fail(res, 'Invalid role');

    await setUserRole(uid, role);
    await users.updateOne({ uid }, { $set: { role, updatedAt: new Date() } });
    return ok(res, { uid, role });
  }

  return fail(res, 'Method not allowed', 405);
}