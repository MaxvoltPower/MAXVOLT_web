import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const contacts = await getCollection(COLLECTIONS.CONTACTS);

  if (req.method === 'POST') {
    const body = parseBody(req);
    const { name, email, message, phone } = body;
    if (!name || !message) return fail(res, 'name and message required');

    const doc = { name, email: email || null, phone: phone || null, message, status: 'new', createdAt: new Date() };
    const result = await contacts.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  if (req.method === 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const items = await contacts.find({}).sort({ createdAt: -1 }).limit(200).toArray();
    return ok(res, items);
  }

  return fail(res, 'Method not allowed', 405);
}