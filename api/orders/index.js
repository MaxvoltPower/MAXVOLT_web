import { requireAuth, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const orders = await getCollection(COLLECTIONS.ORDERS);

  if (req.method === 'GET') {
    const query = user.isAdmin && req.query.all === '1' ? {} : { uid: user.uid };
    const items = await orders.find(query).sort({ createdAt: -1 }).toArray();
    return ok(res, items);
  }

    if (req.method === 'POST') {
    const body = parseBody(req);
    const { items = [], shipping = {}, total, paymentMethod = 'cod' } = body;

    if (!items.length) return fail(res, 'Order must contain items');
    if (!total || total <= 0) return fail(res, 'Invalid total');
    if (!shipping.name || !shipping.phone || !shipping.address) {
        return fail(res, 'Shipping name, phone and address are required');
    }

    // Check stock availability
    const productsCol = await getCollection(COLLECTIONS.PRODUCTS);
    const { ObjectId } = await import('mongodb');

    for (const item of items) {
        if (item.productId && ObjectId.isValid(item.productId)) {
        const p = await productsCol.findOne({ _id: new ObjectId(item.productId) });
        if (p && typeof p.stock === 'number' && p.stock < item.qty) {
            return fail(res, `Insufficient stock for ${p.brand || ''} ${p.model || ''}. Available: ${p.stock}`);
        }
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
        if (item.productId && ObjectId.isValid(item.productId)) {
        await productsCol.updateOne(
            { _id: new ObjectId(item.productId), stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty } }
        );
        }
    }

    return ok(res, { _id: result.insertedId, ...doc }, 201);
    }

  return fail(res, 'Method not allowed', 405);
}