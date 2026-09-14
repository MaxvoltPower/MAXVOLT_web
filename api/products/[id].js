import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!ObjectId.isValid(id)) return fail(res, 'Invalid product ID');

  const products = await getCollection(COLLECTIONS.PRODUCTS);
  const _id = new ObjectId(id);

  if (req.method === 'GET') {
    const doc = await products.findOne({ _id });
    if (!doc) return fail(res, 'Product not found', 404);
    return ok(res, doc);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = parseBody(req);
    delete body._id;
    body.updatedAt = new Date();

    const result = await products.findOneAndUpdate(
      { _id },
      { $set: body },
      { returnDocument: 'after' }
    );
    if (!result) return fail(res, 'Product not found', 404);
    return ok(res, result);
  }

  if (req.method === 'DELETE') {
    const result = await products.deleteOne({ _id });
    if (result.deletedCount === 0) return fail(res, 'Product not found', 404);
    return ok(res, { deleted: true });
  }

  return fail(res, 'Method not allowed', 405);
}