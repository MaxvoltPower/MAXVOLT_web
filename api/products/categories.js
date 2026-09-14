import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const categories = await getCollection(COLLECTIONS.CATEGORIES);

  if (req.method === 'GET') {
    const items = await categories.find({}).sort({ order: 1 }).toArray();
    return ok(res, items);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'POST') {
    const body = parseBody(req);
    if (!body.slug || !body.name) return fail(res, 'slug and name required');

    const doc = { ...body, createdAt: new Date() };
    const result = await categories.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  return fail(res, 'Method not allowed', 405);
}