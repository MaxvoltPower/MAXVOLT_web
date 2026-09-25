import {
  requireAdmin,
  requireAuth,
  ok,
  fail,
  parseBody,
  authenticate,
  getPathSegments,
} from './_lib/middleware.js';
import {
  getCollection,
  COLLECTIONS,
  normalizeImageInput,
  resolveProductImage,
  parseVaToNumber,
  parseAhToNumber,
  parsePrice,
} from './_lib/mongodb.js';
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
 *
 * Router for /api/reviews/*  (folded in to stay under Hobby plan function limit)
 *  GET    /api/reviews?productId=xxx   → list reviews (public)
 *  POST   /api/reviews                 → create review (auth)
 *  DELETE /api/reviews/:id             → delete own review (auth) or any (admin)
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'products');
  const first = segments[0] || '';
  const method = req.method;

  // ---- Folded-in reviews handler ----
  // If the original URL was /api/reviews/* we route to reviews logic.
  const rawUrl = (req.url || '').split('?')[0];
  if (rawUrl.startsWith('/api/reviews')) {
    return handleReviews(req, res);
  }
  if (first === 'reviews') {
    return handleReviews(req, res);
  }

  console.log(
    `[products] ${method} first=${first || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

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

      // Recompute structured numeric fields whenever the string source changes
      if ('va' in body || 'vaNumeric' in body) {
        body.vaNumeric = parseVaToNumber({
          va: body.va,
          vaNumeric: body.vaNumeric,
        });
      }
      if ('capacity' in body || 'capacityAh' in body) {
        body.capacityAh = parseAhToNumber({
          capacity: body.capacity,
          capacityAh: body.capacityAh,
        });
      }
      if ('price' in body || 'discountedPrice' in body) {
        const priceInfo = parsePrice(
          body.discountedPrice !== undefined && body.discountedPrice !== null
            ? body.discountedPrice
            : body.price
        );
        body.numericPrice = priceInfo.invalid ? 0 : priceInfo.min;
      }

      if ('images' in body && Array.isArray(body.images)) {
        body.images = body.images
          .map((img) => {
            const norm = normalizeImageInput(img);
            return norm.ok ? norm.value : null;
          })
          .filter(Boolean);
        body.image = body.images[0] || null;
      } else if ('image' in body) {
        const norm = normalizeImageInput(body.image);
        if (!norm.ok) return fail(res, norm.error);
        body.image = norm.value;
        body.images = [norm.value];
      }

      if ('discountedPrice' in body) {
        const n = Number(body.discountedPrice);
        body.discountedPrice = Number.isFinite(n) && n > 0 ? n : null;
      }
      if ('stock' in body) {
        const n = Number(body.stock);
        body.stock = Number.isFinite(n) && n >= 0 ? n : 0;
      }
      if ('price' in body) {
        const n = Number(body.price);
        body.price = Number.isFinite(n) && n >= 0 ? n : 0;
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

    let imageValue = null;
    let imagesValue = [];
    if (Array.isArray(body.images) && body.images.length) {
      imagesValue = body.images
        .map((img) => {
          const norm = normalizeImageInput(img);
          return norm.ok ? norm.value : null;
        })
        .filter(Boolean);
      imageValue = imagesValue[0] || null;
    } else if (body.image) {
      const norm = normalizeImageInput(body.image);
      if (!norm.ok) return fail(res, norm.error);
      imageValue = norm.value;
      imagesValue = [imageValue];
    }

    const doc = {
      ...body,
      image: imageValue,
      images: imagesValue,
      discountedPrice: body.discountedPrice
        ? Number(body.discountedPrice)
        : null,
      stock: body.stock !== undefined ? Number(body.stock) : 0,
      active: body.active !== false,
      // Structured numeric fields for the calculator + sorting
      vaNumeric: parseVaToNumber(body),
      capacityAh: parseAhToNumber(body),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await products.insertOne(doc);
    return ok(res, toPublicProduct({ _id: result.insertedId, ...doc }), 201);
  }

  return fail(res, 'Method not allowed', 405);
}

function toPublicProduct(doc) {
  if (!doc) return doc;
  const out = { ...doc };
  out.image = resolveProductImage(doc);
  if (Array.isArray(doc.images)) {
    out.images = doc.images.map(resolveProductImage);
  } else if (out.image) {
    out.images = [out.image];
  } else {
    out.images = [];
  }
  return out;
}

// ============================================================
// Reviews (folded in from api/reviews.js)
// ============================================================
const REVIEWS_COLLECTION = 'reviews';

async function handleReviews(req, res) {
  const segments = getPathSegments(req, 'reviews');
  const id = segments[0];
  const method = req.method;
  const reviews = await getCollection(REVIEWS_COLLECTION);

  console.log(
    `[reviews] ${method} id=${id || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

  // ---- GET /api/reviews?productId=xxx ----  (public)
  if (!id && method === 'GET') {
    const { productId, limit = '50' } = req.query;
    if (!productId) return fail(res, 'productId is required');

    const lim = Math.min(parseInt(limit) || 50, 200);
    const items = await reviews
      .find({ productId: String(productId) })
      .sort({ createdAt: -1 })
      .limit(lim)
      .toArray();

    const total = items.length;
    const average = total
      ? items.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of items) {
      const k = Math.round(Number(r.rating) || 0);
      if (k >= 1 && k <= 5) distribution[k] += 1;
    }

    return ok(res, {
      items,
      total,
      average: Math.round(average * 10) / 10,
      distribution,
    });
  }

  // ---- POST /api/reviews ----  (auth required)
  if (!id && method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = parseBody(req);
    const { productId, rating, comment } = body;

    if (!productId) return fail(res, 'productId is required');
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return fail(res, 'rating must be between 1 and 5');
    }
    if (comment && String(comment).length > 1000) {
      return fail(res, 'comment must be 1000 characters or less');
    }

    const existing = await reviews.findOne({
      productId: String(productId),
      uid: user.uid,
    });
    if (existing) {
      return fail(res, 'You have already reviewed this product', 409);
    }

    let userName = user.email ? user.email.split('@')[0] : 'Customer';
    try {
      const users = await getCollection('users');
      const doc = await users.findOne({ uid: user.uid });
      if (doc?.displayName) userName = doc.displayName;
    } catch {
      /* non-fatal */
    }

    const doc = {
      productId: String(productId),
      uid: user.uid,
      userName,
      rating: ratingNum,
      comment: comment ? String(comment).trim() : '',
      createdAt: new Date(),
    };

    const result = await reviews.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  // ---- DELETE /api/reviews/:id ----  (auth: owner or admin)
  if (id && method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (!ObjectId.isValid(id)) return fail(res, 'Invalid review ID');
    const _id = new ObjectId(id);

    const review = await reviews.findOne({ _id });
    if (!review) return fail(res, 'Review not found', 404);

    if (!user.isAdmin && review.uid !== user.uid) {
      return fail(res, 'You can only delete your own review', 403);
    }

    await reviews.deleteOne({ _id });
    return ok(res, { deleted: true });
  }

  return fail(res, 'Not found', 404);
}