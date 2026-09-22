// ============================================================
// MAXVOLT — Orders API
// ============================================================

import { requireAuth, ok, fail, parseBody } from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

const VALID_STATUSES = [
  'placed',
  'pending_payment',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/**
 * Find a product by either Mongo _id or the custom string `id`.
 */
async function findProductById(productsCol, productId) {
  if (!productId) return null;
  if (ObjectId.isValid(productId)) {
    const byOid = await productsCol.findOne({ _id: new ObjectId(productId) });
    if (byOid) return byOid;
  }
  // Fall back to custom string `id`
  return productsCol.findOne({ id: productId });
}

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const segments = getPathSegments(req, 'orders');
  const id = segments[0];
  const method = req.method;
  const orders = await getCollection(COLLECTIONS.ORDERS);

  // ---- /api/orders/:id ----
  if (id) {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid order ID');
    const _id = new ObjectId(id);

    if (method === 'GET') {
      const query = user.isAdmin ? { _id } : { _id, uid: user.uid };
      const doc = await orders.findOne(query);
      if (!doc) return fail(res, 'Order not found', 404);
      return ok(res, doc);
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = parseBody(req);
      const update = {};
      if (user.isAdmin) {
        if (body.status) {
          if (!VALID_STATUSES.includes(body.status))
            return fail(res, 'Invalid status');
          update.status = body.status;
        }
        if (body.paymentStatus) update.paymentStatus = body.paymentStatus;
        if (body.trackingId) update.trackingId = body.trackingId;
        if (body.adminNotes) update.adminNotes = body.adminNotes;
      } else {
        if (body.status === 'cancelled') {
          const existing = await orders.findOne({ _id, uid: user.uid });
          if (!existing) return fail(res, 'Order not found', 404);
          if (existing.status !== 'placed')
            return fail(res, 'Only placed orders can be cancelled');
          update.status = 'cancelled';
        } else {
          return fail(res, 'Unauthorized update', 403);
        }
      }
      update.updatedAt = new Date();
      const result = await orders.findOneAndUpdate(
        { _id },
        { $set: update },
        { returnDocument: 'after' }
      );
      return ok(res, result);
    }

    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/orders (root) ----
  if (method === 'GET') {
    const query =
      user.isAdmin && req.query.all === '1' ? {} : { uid: user.uid };
    const items = await orders.find(query).sort({ createdAt: -1 }).toArray();
    return ok(res, items);
  }

  if (method === 'POST') {
    const body = parseBody(req);
    const { items = [], shipping = {}, total, paymentMethod = 'cod' } = body;

    if (!items.length) return fail(res, 'Order must contain items');
    if (!total || total <= 0) return fail(res, 'Invalid total');
    if (!shipping.name || !shipping.phone || !shipping.address) {
      return fail(res, 'Shipping name, phone and address are required');
    }

    const productsCol = await getCollection(COLLECTIONS.PRODUCTS);

    // Stock validation (by custom id or _id)
    for (const item of items) {
      const p = await findProductById(productsCol, item.productId);
      if (p && typeof p.stock === 'number' && p.stock < item.qty) {
        return fail(
          res,
          `Insufficient stock for ${p.brand || ''} ${p.model || ''}. Available: ${p.stock}`
        );
      }
    }

    const doc = {
      uid: user.uid,
      email: user.email,
      items,
      shipping,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await orders.insertOne(doc);

    // Decrement stock (best-effort)
    for (const item of items) {
      const p = await findProductById(productsCol, item.productId);
      if (p && typeof p.stock === 'number') {
        await productsCol.updateOne(
          { _id: p._id, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } }
        );
      }
    }

    return ok(res, { _id: result.insertedId, ...doc }, 201);
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