import { requireAdmin, ok, fail, parseBody } from './_lib/middleware.js';
import { getCollection } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'sections';

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'sections');
  const id = segments[0];
  const col = await getCollection(COLLECTION);

  if (req.method === 'GET' && !id) {
    const sections = await col.find({ active: { $ne: false } }).sort({ order: 1 }).toArray();
    return ok(res, sections);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (id) {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid ID');
    const _id = new ObjectId(id);
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = parseBody(req);
      const result = await col.findOneAndUpdate({ _id }, { $set: { ...body, updatedAt: new Date() } }, { returnDocument: 'after' });
      return ok(res, result);
    }
    if (req.method === 'DELETE') {
      await col.deleteOne({ _id });
      return ok(res, { deleted: true });
    }
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    if (!body.title || !body.type) return fail(res, 'title and type required');
    const doc = { ...body, createdAt: new Date(), updatedAt: new Date() };
    const result = await col.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  return fail(res, 'Not found', 404);
}

function getPathSegments(req, prefix) {
  if (req.query && req.query.path) {
    return Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  }
  const url = (req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const idx = parts.indexOf(prefix);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}