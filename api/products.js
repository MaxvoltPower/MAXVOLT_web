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
  normalizeImageArray,
  resolveProductImage,
  parseVaToNumber,
  parseAhToNumber,
  parsePrice,
} from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'products');
  const first = segments[0] || '';
  const method = req.method;

  // ---- Folded-in reviews handler (works on Vercel via __module marker) ----
  const rawUrl = (req.url || '').split('?')[0];
  if (
    rawUrl.startsWith('/api/reviews') ||
    req.query?.__module === 'reviews' ||
    first === 'reviews'
  ) {
    return handleReviews(req, res);
  }

  console.log(
    `[products] ${method} first=${first || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

  // ---- /api/products/bulk-export ----
  if (first === 'bulk-export' && method === 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const col = await getCollection(COLLECTIONS.PRODUCTS);
    const items = await col
      .find({})
      .sort({ order: 1, category: 1, brand: 1, model: 1 })
      .toArray();

    return ok(res, {
      items: items.map((d) => ({ ...d, _id: String(d._id) })),
      total: items.length,
      exportedAt: new Date().toISOString(),
    });
  }

  // ---- /api/products/bulk-import ----
  if (first === 'bulk-import' && method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const body = parseBody(req);
    const { rows = [], mode = 'upsert' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return fail(res, 'rows array is required');
    }
    if (rows.length > 5000) {
      return fail(res, 'Too many rows (max 5000 per import)');
    }
    if (!['update', 'upsert', 'replace'].includes(mode)) {
      return fail(res, 'mode must be update | upsert | replace');
    }

    const col = await getCollection(COLLECTIONS.PRODUCTS);

    const allExisting = await col.find({}).toArray();
    const byMongoId = new Map(allExisting.map((p) => [String(p._id), p]));
    const byCustomId = new Map(
      allExisting.filter((p) => p.id).map((p) => [String(p.id), p])
    );

    const results = { created: [], updated: [], skipped: [], errors: [] };
    const now = new Date();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const mongoId = row._id ? String(row._id).trim() : '';
        const customId = row.id ? String(row.id).trim() : '';

        let existing = null;
        if (mongoId && ObjectId.isValid(mongoId)) {
          existing = byMongoId.get(mongoId) || null;
        }
        if (!existing && customId) {
          existing = byCustomId.get(customId) || null;
        }

        if (!row.model || !row.brand || !row.category) {
          results.skipped.push({
            row: rowNum,
            id: customId || mongoId || '(none)',
            reason: 'model, brand, category are required',
          });
          continue;
        }

        const { doc, unset } = buildProductDocFromRow(row, now);

        if (existing) {
          if (mode === 'update' || mode === 'upsert') {
            delete doc._id;
            doc.vaNumeric = parseVaToNumber(doc);
            doc.capacityAh = parseAhToNumber(doc);
            const update = { $set: doc };
            if (Object.keys(unset).length) update.$unset = unset;
            await col.updateOne({ _id: existing._id }, update);
            results.updated.push({
              row: rowNum,
              id: String(existing._id),
              customId: doc.id || existing.id,
              model: doc.model,
            });
          } else {
            results.skipped.push({
              row: rowNum,
              id: String(existing._id),
              reason: 'already exists (mode=replace)',
            });
          }
        } else {
          if (mode === 'update') {
            results.skipped.push({
              row: rowNum,
              id: customId || '(new)',
              reason: 'not found in DB (mode=update)',
            });
            continue;
          }
          if (!customId) {
            doc.id = `IMP-${Date.now()}-${i}`;
          }
          doc.vaNumeric = parseVaToNumber(doc);
          doc.capacityAh = parseAhToNumber(doc);
          doc.createdAt = now;
          doc.updatedAt = now;
          const ins = await col.insertOne(doc);
          results.created.push({
            row: rowNum,
            id: String(ins.insertedId),
            customId: doc.id,
            model: doc.model,
          });
        }
      } catch (err) {
        results.errors.push({
          row: rowNum,
          id: row.id || row._id || '(unknown)',
          reason: err.message,
        });
      }
    }

    return ok(res, {
      summary: {
        total: rows.length,
        created: results.created.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
    });
  }

  // ---- /api/products/:id ----
  if (first && first !== 'list') {
    if (!ObjectId.isValid(first)) return fail(res, 'Invalid product ID');
    const products = await getCollection(COLLECTIONS.PRODUCTS);
    const _id = new ObjectId(first);

    if (method === 'GET') {
      const doc = await products.findOne({ _id });
      if (!doc) return fail(res, 'Product not found', 404);
      return ok(res, toPublicProduct(doc, { fullImages: true }));
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (method === 'PUT' || method === 'PATCH') {
      const body = parseBody(req);
      delete body._id;

      if ('va' in body || 'vaNumeric' in body) {
        body.vaNumeric = parseVaToNumber({ va: body.va, vaNumeric: body.vaNumeric });
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

      const touchedImages = 'images' in body || 'image' in body;
      if (touchedImages) {
        let nextImages = [];
        if (Array.isArray(body.images)) {
          nextImages = normalizeImageArray(body.images);
        }
        if (nextImages.length === 0 && 'image' in body) {
          const norm = normalizeImageInput(body.image);
          if (!norm.ok) return fail(res, norm.error);
          if (norm.value) nextImages = [norm.value];
        }
        body.images = nextImages;
        body.image = nextImages[0] || null;
      }

      if ('discountedPrice' in body) {
        const n = Number(body.discountedPrice);
        body.discountedPrice = Number.isFinite(n) && n > 0 ? n : null;
      }
      if ('stock' in body) {
        const n = Number(body.stock);
        body.stock = Number.isFinite(n) && n >= 0 ? n : 0;
      }
      if ('order' in body) {
        const n = Number(body.order);
        body.order = Number.isFinite(n) ? n : 999;
      }
      if ('price' in body) {
        if (typeof body.price === 'number') {
          body.price = Number.isFinite(body.price) && body.price >= 0 ? body.price : 0;
        } else if (body.price !== null && body.price !== undefined) {
          body.price = String(body.price);
        }
      }

      body.updatedAt = new Date();
      const result = await products.findOneAndUpdate(
        { _id },
        { $set: body },
        { returnDocument: 'after', includeResultMetadata: false }
      );
      if (!result) return fail(res, 'Product not found', 404);
      return ok(res, toPublicProduct(result, { fullImages: true }));
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
      .sort({ order: 1, category: 1, brand: 1, createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .toArray();
    const total = await products.countDocuments(query);
    return ok(res, {
      items: items.map((d) => toPublicProduct(d, { fullImages: false })),
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

    // ---- Image handling (images[] wins, then fallback to single image) ----
    let imagesValue = [];
    if (Array.isArray(body.images)) {
      imagesValue = normalizeImageArray(body.images);
    }
    if (imagesValue.length === 0 && body.image) {
      const norm = normalizeImageInput(body.image);
      if (!norm.ok) return fail(res, norm.error);
      if (norm.value) imagesValue = [norm.value];
    }

    const imageValue = imagesValue[0] || null;

    const doc = {
      ...body,
      image: imageValue,
      images: imagesValue,
      discountedPrice: body.discountedPrice ? Number(body.discountedPrice) : null,
      stock: body.stock !== undefined ? Number(body.stock) : 0,
      order: body.order !== undefined ? Number(body.order) : 999,
      active: body.active !== false,
      vaNumeric: parseVaToNumber(body),
      capacityAh: parseAhToNumber(body),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await products.insertOne(doc);
    return ok(res, toPublicProduct({ _id: result.insertedId, ...doc }, { fullImages: true }), 201);
  }

  return fail(res, 'Method not allowed', 405);
}

/**
 * Convert a raw Mongo product document into a shape safe to send to the client.
 *
 * When `fullImages` is false (list endpoints), the `images` array is omitted
 * so responses stay small even when products store base64 data URLs.
 */
function toPublicProduct(doc, { fullImages = false } = {}) {
  if (!doc) return doc;
  const out = { ...doc };

  if (!out.id && out._id) {
    out.id = String(out._id);
  }

  out.image = resolveProductImage(doc);

  if (fullImages) {
    let resolvedImages = [];
    if (Array.isArray(doc.images)) {
      resolvedImages = doc.images
        .map((img) => resolveProductImage(img))
        .filter(Boolean);
    }
    if (resolvedImages.length === 0 && out.image) {
      resolvedImages = [out.image];
    }
    out.images = resolvedImages;
    if (!out.image && resolvedImages.length > 0) {
      out.image = resolvedImages[0];
    }
  } else {
    delete out.images;
  }

  return out;
}

// ============================================================
// Bulk import helper
// ============================================================

function buildProductDocFromRow(row, now) {
  const doc = { updatedAt: now };
  const unset = {};

  const strFields = [
    'id', 'brand', 'model', 'category', 'type', 'capacity', 'voltage',
    'va', 'warranty', 'waveType', 'runtime', 'terminal', 'suitableCars',
    'suitableLoad', 'suitableFor', 'bestFor', 'configurable',
    'availability', 'image', 'imageAlt',
  ];
  for (const k of strFields) {
    if (row[k] === undefined || row[k] === null) continue;
    const s = String(row[k]).trim();
    if (s) doc[k] = s;
    else unset[k] = '';
  }

  if (row.price !== undefined && row.price !== '') doc.price = row.price;
  if (row.discountedPrice === '' || row.discountedPrice === null) {
    unset.discountedPrice = '';
    doc.discountedPrice = null;
  } else if (row.discountedPrice !== undefined) {
    const n = Number(row.discountedPrice);
    doc.discountedPrice = Number.isFinite(n) && n > 0 ? n : null;
  }

  if (row.stock === '' || row.stock === null) {
    unset.stock = '';
  } else if (row.stock !== undefined) {
    const n = Number(row.stock);
    doc.stock = Number.isFinite(n) && n >= 0 ? n : 0;
  }

  if (row.order === '' || row.order === null) {
    unset.order = '';
  } else if (row.order !== undefined) {
    const n = Number(row.order);
    doc.order = Number.isFinite(n) ? n : 999;
  }

  doc.active = truthy(row.active, true);
  doc.featured = truthy(row.featured, false);

  if (row.images !== undefined && row.images !== null && String(row.images).trim() !== '') {
    const list = String(row.images)
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    doc.images = list;
    doc.image = list[0] || null;
  } else if (doc.image) {
    doc.images = [doc.image];
  }

  const priceInfo = parsePrice(
    doc.discountedPrice !== undefined && doc.discountedPrice !== null
      ? doc.discountedPrice
      : doc.price
  );
  doc.numericPrice = priceInfo.invalid ? 0 : priceInfo.min;

  return { doc, unset };
}

function truthy(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'active', 'visible'].includes(s)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'hidden'].includes(s)) return false;
  return fallback;
}

// ============================================================
// Reviews (folded in from api/reviews.js)
// ============================================================
const REVIEWS_COLLECTION = 'reviews';

async function handleReviews(req, res) {
  let segments = getPathSegments(req, 'reviews');
  if (segments.length === 0 && req.query?.__module === 'reviews') {
    const p = req.query.path;
    if (Array.isArray(p)) segments = p.filter(Boolean);
    else if (typeof p === 'string' && p) segments = p.split('/').filter(Boolean);
  }

  const id = segments[0];
  const method = req.method;
  const reviews = await getCollection(REVIEWS_COLLECTION);

  console.log(
    `[reviews] ${method} id=${id || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

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