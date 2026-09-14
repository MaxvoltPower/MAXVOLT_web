import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { authenticate } from '../_lib/middleware.js';

export default async function handler(req, res) {
  const products = await getCollection(COLLECTIONS.PRODUCTS);

  if (req.method === 'GET') {
    // If caller is admin, allow seeing inactive products
    const auth = await authenticate(req);
    const isAdmin = !!auth?.isAdmin;

    const { category, brand, search, limit = '100', page = '1' } = req.query;
    const query = {};

    // Public users only see active products
    if (!isAdmin) query.active = { $ne: false };

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const lim = Math.min(parseInt(limit) || 100, 1000);
    const skip = ((parseInt(page) || 1) - 1) * lim;

    const items = await products
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .toArray();

    const total = await products.countDocuments(query);

    return ok(res, { items, total, page: parseInt(page) || 1, limit: lim });
  }

  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const body = parseBody(req);
    if (!body.model || !body.brand || !body.category) {
      return fail(res, 'model, brand, category are required');
    }

    const doc = {
      ...body,
      active: body.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await products.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  return fail(res, 'Method not allowed', 405);
}