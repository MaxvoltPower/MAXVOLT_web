import crypto from 'crypto';
import { requireAuth, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const user = await requireAuth(req, res);
  if (!user) return;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parseBody(req);

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