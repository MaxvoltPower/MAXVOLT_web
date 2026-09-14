import { requireAuth, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const users = await getCollection(COLLECTIONS.USERS);

  if (req.method === 'GET') {
    const doc = await users.findOne({ uid: user.uid });
    return ok(res, doc || {});
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = parseBody(req);
    const allowed = ['displayName', 'phone', 'address', 'city', 'pincode', 'photoURL'];
    const update = {};
    for (const k of allowed) {
      if (body[k] !== undefined) update[k] = body[k];
    }
    update.updatedAt = new Date();

    await users.updateOne({ uid: user.uid }, { $set: update }, { upsert: true });
    const doc = await users.findOne({ uid: user.uid });
    return ok(res, doc);
  }

  return fail(res, 'Method not allowed', 405);
}