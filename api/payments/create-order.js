import { requireAuth, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { getRazorpay } from '../_lib/razorpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

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
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: { uid: user.uid, email: user.email || '' },
    });

    // Create our internal order document
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