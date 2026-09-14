import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!ObjectId.isValid(id)) return fail(res, 'Invalid quote ID');

  const quotes = await getCollection(COLLECTIONS.QUOTES);
  const _id = new ObjectId(id);

  if (req.method === 'GET') {
    const doc = await quotes.findOne({ _id });
    if (!doc) return fail(res, 'Quote not found', 404);
    return ok(res, doc);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = parseBody(req);
    const update = {};
    if (body.status) update.status = body.status; // new | contacted | quoted | won | lost
    if (body.adminNotes) update.adminNotes = body.adminNotes;
    if (body.quotedAmount !== undefined) update.quotedAmount = body.quotedAmount;
    update.updatedAt = new Date();

    const result = await quotes.findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after' });
    return ok(res, result);
  }

  if (req.method === 'DELETE') {
    await quotes.deleteOne({ _id });
    return ok(res, { deleted: true });
  }

  return fail(res, 'Method not allowed', 405);
}