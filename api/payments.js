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

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'payments');
  const action = segments[0] || '';
  const method = req.method;

  console.log(
    `[payments] ${method} action=${action || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

  // ---- create-order ----
  if (action === 'create-order') {
    if (method !== 'POST') return fail(res, 'Method not allowed', 405);
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = parseBody(req);
    const { amount, currency = 'INR', items = [], shipping = {} } = body;
    if (!amount || amount < 100)
      return fail(res, 'Amount must be at least ₹1 (100 paise)');

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
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const isValid = expectedSignature === razorpay_signature;

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
    await orders.updateOne(filter, {
      $set: {
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await payments.insertOne({
      uid: user.uid,
      orderId: orderId || null,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: 'captured',
      createdAt: new Date(),
    });
    return ok(res, { verified: true, paymentId: razorpay_payment_id });
  }

  return fail(res, 'Not found', 404);
}