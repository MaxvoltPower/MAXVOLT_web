import { requireAdmin, ok, fail, parseBody, authenticate } from './_lib/middleware.js';
import { getCollection, COLLECTIONS, normalizeImageInput, resolveProductImage } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

/**
 * Router for /api/products/*
 *  GET    /api/products                → list products (paginated)
 *  POST   /api/products                → create (admin)
 *  GET    /api/products/categories     → list categories
 *  POST   /api/products/categories     → create category (admin)
 *  GET    /api/products/:id            → single product
 *  PUT    /api/products/:id            → update (admin)
 *  DELETE /api/products/:id            → delete (admin)
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'products');
  const first = segments[0] || '';
  const method = req.method;

  // ---- /api/products/categories ----
  if (first === 'categories') {
    const categories = await getCollection(COLLECTIONS.CATEGORIES);
    if (method === 'GET') {
      const items = await categories.find({}).sort({ order: 1 }).toArray();
      return ok(res, items);
    }
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (method === 'POST') {
      const body = parseBody(req);
      if (!body.slug || !body.name) return fail(res, 'slug and name required');
      const doc = { ...body, createdAt: new Date() };
      const result = await categories.insertOne(doc);
      return ok(res, { _id: result.insertedId, ...doc }, 201);
    }
    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/products/:id ----
  if (first && first !== 'list') {
    if (!ObjectId.isValid(first)) return fail(res, 'Invalid product ID');
    const products = await getCollection(COLLECTIONS.PRODUCTS);
    const _id = new ObjectId(first);

    if (method === 'GET') {
      const doc = await products.findOne({ _id });
      if (!doc) return fail(res, 'Product not found', 404);
      return ok(res, toPublicProduct(doc));
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (method === 'PUT' || method === 'PATCH') {
      const body = parseBody(req);
      delete body._id;

      // Handle image field
      if ('image' in body) {
        const norm = normalizeImageInput(body.image);
        if (!norm.ok) return fail(res, norm.error);
        body.image = norm.value;
      }

      body.updatedAt = new Date();
      const result = await products.findOneAndUpdate(
        { _id },
        { $set: body },
        { returnDocument: 'after' }
      );
      if (!result) return fail(res, 'Product not found', 404);
      return ok(res, toPublicProduct(result));
    }

    if (method === 'DELETE') {
      const result = await products.deleteOne({ _id });
      if (result.deletedCount === 0) return fail(res, 'Product not found', 404);
      return ok(res, { deleted: true });
    }

    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/products (root) ----
  const products = await getCollection(COLLECTIONS.PRODUCTS);

  if (method === 'GET') {
    const auth = await authenticate(req);
    const isAdmin = !!auth?.isAdmin;
    const { category, brand, search, limit = '200', page = '1', all } = req.query;
    const query = {};
    if (!isAdmin || all !== '1') query.active = { $ne: false };
    if (category && category !== 'all') query.category = category;
    if (brand && brand !== 'all') query.brand = brand;
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    const lim = Math.min(parseInt(limit) || 200, 1000);
    const skip = ((parseInt(page) || 1) - 1) * lim;
    const items = await products
      .find(query)
      .sort({ category: 1, brand: 1, createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .toArray();
    const total = await products.countDocuments(query);
    return ok(res, {
      items: items.map(toPublicProduct),
      total,
      page: parseInt(page) || 1,
      limit: lim,
    });
  }

  if (method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = parseBody(req);
    if (!body.model || !body.brand || !body.category) {
      return fail(res, 'model, brand, category are required');
    }

    // Image handling
    let imageValue = null;
    if (body.image) {
      const norm = normalizeImageInput(body.image);
      if (!norm.ok) return fail(res, norm.error);
      imageValue = norm.value;
    }

    const doc = {
      ...body,
      image: imageValue,
      active: body.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await products.insertOne(doc);
    return ok(res, toPublicProduct({ _id: result.insertedId, ...doc }), 201);
  }

  return fail(res, 'Method not allowed', 405);
}

/** Convert a Mongo product doc into a shape safe for the public + includes a resolved image URL */
function toPublicProduct(doc) {
  if (!doc) return doc;
  const out = { ...doc };
  out.image = resolveProductImage(doc);
  return out;
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