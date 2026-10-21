import crypto from 'crypto';
import {
  requireAuth,
  ok,
  fail,
  parseBody,
  getPathSegments,
} from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { getRazorpay } from './_lib/razorpay.js';
import { ObjectId } from 'mongodb';

/**
 * Idempotent stock decrement — mirrors api/webhook.js decrementStockOnce().
 * Safe to call from both /verify and the webhook.
 */
async function decrementStockOnce(orders, orderId) {
  const claimed = await orders.findOneAndUpdate(
    { _id: orderId, stockDecremented: { $ne: true } },
    { $set: { stockDecremented: true } },
    { returnDocument: 'after', includeResultMetadata: false }
  );
  if (!claimed) return; // already handled

  const items = Array.isArray(claimed.items) ? claimed.items : [];
  if (items.length === 0) return;

  const products = await getCollection(COLLECTIONS.PRODUCTS);
  for (const item of items) {
    if (!item?.productId || !item?.qty) continue;
    const filter = ObjectId.isValid(item.productId)
      ? { _id: new ObjectId(item.productId), stock: { $gte: item.qty } }
      : { id: item.productId, stock: { $gte: item.qty } };
    try {
      await products.updateOne(filter, { $inc: { stock: -item.qty } });
    } catch (err) {
      console.warn(`[payments] stock decrement failed for ${item.productId}:`, err.message);
    }
  }
}

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'payments');
  const action = segments[0] || '';
  const method = req.method;

  console.log(
    `[payments] ${method} action=${action || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path    )}`
  );

  // ---- create-order ----
  if (action === 'create-order') {
    if (method !== 'POST') return fail(res, 'Method not allowed', 405);
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = parseBody(req);
    const { amount, currency = 'INR', items = [], shipping = {} } = body;
    if (!amount || amount < 100) {
      return fail(res, 'Amount must be at least ₹1 (100 paise)');
    }

    try {
      const razorpay = getRazorpay();
      const rpOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt: `rcpt_${Date.now()}`,
        notes: { uid: user.uid, email: user.email || '' },
      });
      const orders = await getCollection(COLLECTIONS.ORDERS);
      const orderDoc = {
        uid: user.uid,
        email: user.email,
        items,
        shipping,
        total: amount,
        currency,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        status: 'pending_payment',
        razorpayOrderId: rpOrder.id,
        stockDecremented: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const inserted = await orders.insertOne(orderDoc);
      return ok(res, {
        orderId: inserted.insertedId,
        razorpayOrderId: rpOrder.id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error('Razorpay create order error:', err);
      return fail(res, err.message || 'Failed to create payment order', 500);
    }
  }

  // ---- verify ----
  if (action === 'verify') {
    if (method !== 'POST') return fail(res, 'Method not allowed', 405);
    const user = await requireAuth(req, res);
    if (!user) return;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = parseBody(req);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail(res, 'Missing payment verification fields');
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[payments] RAZORPAY_KEY_SECRET is not set');
      return fail(res, 'Payment configuration error', 500);
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isValid = false;
    try {
      isValid =
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(razorpay_signature)
        );
    } catch {
      isValid = false;
    }

    const orders = await getCollection(COLLECTIONS.ORDERS);
    const payments = await getCollection(COLLECTIONS.PAYMENTS);
    const filter = ObjectId.isValid(orderId)
      ? { _id: new ObjectId(orderId), uid: user.uid }
      : { razorpayOrderId: razorpay_order_id, uid: user.uid };

    if (!isValid) {
      await orders.updateOne(filter, {
        $set: { paymentStatus: 'failed', updatedAt: new Date() },
      });
      return fail(res, 'Payment signature verification failed', 400);
    }

    const updated = await orders.findOneAndUpdate(
      filter,
      {
        $set: {
          paymentStatus: 'paid',
          status: 'confirmed',
          razorpayPaymentId: razorpay_payment_id,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after', includeResultMetadata: false }
    );

    await payments.insertOne({
      uid: user.uid,
      orderId: orderId || null,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: 'captured',
      createdAt: new Date(),
    });

    // Fallback: if the webhook never arrives, ensure stock is still decremented.
    // This is idempotent thanks to the atomic stockDecremented claim.
    if (updated?._id) {
      try {
        await decrementStockOnce(orders, updated._id);
      } catch (err) {
        console.warn('[payments] fallback stock decrement failed:', err.message);
      }
    }

    return ok(res, { verified: true, paymentId: razorpay_payment_id });
  }

  return fail(res, 'Not found', 404);
}