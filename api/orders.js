// ============================================================
// MAXVOLT — Orders API
// ============================================================

import {
  requireAuth,
  ok,
  fail,
  parseBody,
  getPathSegments,
} from './_lib/middleware.js';
import { getCollection, getDb, COLLECTIONS } from './_lib/mongodb.js';
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

async function findProductById(productsCol, productId, opts = {}) {
  if (!productId) return null;
  if (ObjectId.isValid(productId)) {
    const byOid = await productsCol.findOne(
      { _id: new ObjectId(productId) },
      opts
    );
    if (byOid) return byOid;
  }
  return productsCol.findOne({ id: productId }, opts);
}

/**
 * Validate that every product has enough stock.
 * Returns null on success, or an error string on failure.
 */
async function validateStock(productsCol, items) {
  for (const item of items) {
    const p = await findProductById(productsCol, item.productId);
    if (p && typeof p.stock === 'number' && p.stock < item.qty) {
      return `Insufficient stock for ${p.brand || ''} ${p.model || ''}. Available: ${p.stock}`;
    }
  }
  return null;
}

/**
 * Decrement stock for every item. Uses a MongoDB transaction when the
 * driver supports it (Atlas replica sets), otherwise falls back to the
 * best-effort rollback path.
 *
 * Returns null on success, or an error string on failure.
 */
async function decrementStock(client, productsCol, items) {
  let session = null;
  try {
    session = client.startSession();
    session.startTransaction();
  } catch {
    // Standalone Mongo (no replica set) — transactions not supported.
    // Fall back to the rollback approach.
    if (session) {
      try { await session.endSession(); } catch { /* ignore */ }
    }
    session = null;
  }

  const applied = [];

  try {
    for (const item of items) {
      const p = await findProductById(productsCol, item.productId, session ? { session } : {});
      if (!p || typeof p.stock !== 'number') continue; // stock not tracked

      const r = await productsCol.updateOne(
        { _id: p._id, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        session ? { session } : {}
      );

      if (r.modifiedCount !== 1) {
        throw new Error(
          `Stock ran out for ${p.brand || ''} ${p.model || ''}. Please retry.`
        );
      }
      applied.push({ _id: p._id, qty: item.qty });
    }

    if (session) {
      await session.commitTransaction();
    }
    return null;
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
      return err.message;
    }

    // Fallback path: manual rollback of whatever we already decremented.
    for (const d of applied) {
      try {
        await productsCol.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
      } catch (rollbackErr) {
        console.error(
          '[orders] stock rollback failed for',
          d._id,
          rollbackErr.message
        );
      }
    }
    return err.message;
  } finally {
    if (session) {
      try { await session.endSession(); } catch { /* ignore */ }
    }
  }
}

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const segments = getPathSegments(req, 'orders');
  const id = segments[0];
  const method = req.method;
  const orders = await getCollection(COLLECTIONS.ORDERS);

  console.log(
    `[orders] ${method} id=${id || '(root)'} user=${user.email} isAdmin=${user.isAdmin} url=${req.url}`
  );

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
          if (!VALID_STATUSES.includes(body.status)) {
            return fail(res, 'Invalid status');
          }
          update.status = body.status;
        }
        if (body.paymentStatus) update.paymentStatus = body.paymentStatus;
        if (body.trackingId) update.trackingId = body.trackingId;
        if (body.adminNotes) update.adminNotes = body.adminNotes;
      } else {
        if (body.status === 'cancelled') {
          const existing = await orders.findOne({ _id, uid: user.uid });
          if (!existing) return fail(res, 'Order not found', 404);
          if (!['placed', 'pending_payment'].includes(existing.status)) {
            return fail(res, 'Only placed or pending-payment orders can be cancelled');
          }
          update.status = 'cancelled';
        } else {
          return fail(res, 'Unauthorized update', 403);
        }
      }
      update.updatedAt = new Date();
      const result = await orders.findOneAndUpdate(
        { _id },
        { $set: update },
        { returnDocument: 'after', includeResultMetadata: false }
      );
      if (!result) return fail(res, 'Order not found', 404);
      return ok(res, result);
    }

    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/orders (root) ----
  if (method === 'GET') {
    const query = user.isAdmin ? {} : { uid: user.uid };
    const items = await orders
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
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

    // 1) Validate stock for every item BEFORE touching anything
    const validationError = await validateStock(productsCol, items);
    if (validationError) return fail(res, validationError, 409);

    const doc = {
      uid: user.uid,
      email: user.email,
      items,
      shipping,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
      stockDecremented: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await orders.insertOne(doc);

    // 2) Decrement stock AFTER the insert. Uses a Mongo transaction when
    //    the driver supports it, otherwise a best-effort rollback.
    const { client } = await getDb();
    const stockError = await decrementStock(client, productsCol, items);
    if (stockError) {
      await orders.deleteOne({ _id: result.insertedId });
      return fail(res, stockError, 409);
    }

    // 3) Mark the order as stock-decremented so the webhook won't double-decrement
    await orders.updateOne(
      { _id: result.insertedId },
      { $set: { stockDecremented: true } }
    );

    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  return fail(res, 'Method not allowed', 405);
}