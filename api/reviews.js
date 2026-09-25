// ============================================================
// MAXVOLT — Product reviews API
// ============================================================
//  GET    /api/reviews?productId=xxx   → list reviews (public)
//  POST   /api/reviews                 → create review (auth)
//  DELETE /api/reviews/:id             → delete own review (auth)
//                                        or any review (admin)
// ============================================================

import {
  requireAuth,
  ok,
  fail,
  parseBody,
  getPathSegments,
} from './_lib/middleware.js';
import { getCollection } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'reviews';

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'reviews');
  const id = segments[0];
  const method = req.method;
  const reviews = await getCollection(COLLECTION);

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

    // Compute aggregate stats
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

    // Prevent duplicate reviews from the same user on the same product
    const existing = await reviews.findOne({
      productId: String(productId),
      uid: user.uid,
    });
    if (existing) {
      return fail(res, 'You have already reviewed this product', 409);
    }

    // Look up display name from the users collection for nicer rendering
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