import {
  authenticate, requireAuth, requireAdmin,
  ok, fail, parseBody, ensureUserDoc
} from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

/**
 * Router for /api/quotes/*
 *  POST   /api/quotes       → public: submit quote
 *  GET    /api/quotes       → admin: list all
 *  GET    /api/quotes/:id   → admin: get one
 *  PATCH  /api/quotes/:id   → admin: update
 *  DELETE /api/quotes/:id   → admin: delete
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'quotes');
  const id = segments[0];
  const method = req.method;
  const quotes = await getCollection(COLLECTIONS.QUOTES);

  // ---- /api/quotes/:id (admin only) ----
  if (id) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid quote ID');
    const _id = new ObjectId(id);

    if (method === 'GET') {
      const doc = await quotes.findOne({ _id });
      if (!doc) return fail(res, 'Quote not found', 404);
      return ok(res, doc);
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = parseBody(req);
      const update = {};
      if (body.status) update.status = body.status;
      if (body.adminNotes) update.adminNotes = body.adminNotes;
      if (body.quotedAmount !== undefined) update.quotedAmount = body.quotedAmount;
      update.updatedAt = new Date();
      const result = await quotes.findOneAndUpdate(
        { _id }, { $set: update }, { returnDocument: 'after' }
      );
      return ok(res, result);
    }

    if (method === 'DELETE') {
      await quotes.deleteOne({ _id });
      return ok(res, { deleted: true });
    }

    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/quotes (root) ----
  if (method === 'POST') {
    const body = parseBody(req);
    const { name, phone, email, requirement, location, message } = body;
    if (!name || !phone || !requirement) {
      return fail(res, 'name, phone and requirement are required');
    }
    const user = await authenticate(req);
    if (user) await ensureUserDoc(user);

    const doc = {
      uid: user?.uid || null,
      name, phone,
      email: email || null,
      requirement,
      location: location || null,
      message: message || null,
      status: 'new',
      createdAt: new Date(),
    };
    const result = await quotes.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  if (method === 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const items = await quotes.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return ok(res, items);
  }

  return fail(res, 'Method not allowed', 405);
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