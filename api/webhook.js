// ============================================================
// MAXVOLT — Razorpay webhook (idempotent, stock-safe)
// ============================================================

import crypto from 'crypto';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (req.body && Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Decrement stock for every item in an order exactly once.
 * The order doc is atomically flipped from stockDecremented:false →
 * stockDecremented:true so Razorpay webhook retries never double-decrement.
 */
async function decrementStockOnce(orders, orderId) {
  // Atomically claim the "decrement" slot
  const claimed = await orders.findOneAndUpdate(
    { _id: orderId, stockDecremented: { $ne: true } },
    { $set: { stockDecremented: true } },
    { returnDocument: 'after', includeResultMetadata: false }
  );
  if (!claimed) return; // already processed by an earlier webhook delivery

  const items = Array.isArray(claimed.items) ? claimed.items : [];
  if (items.length === 0) return;

  const products = await getCollection(COLLECTIONS.PRODUCTS);
  for (const item of items) {
    if (!item?.productId || !item?.qty) continue;
    const filterById = ObjectId.isValid(item.productId)
      ? { _id: new ObjectId(item.productId), stock: { $gte: item.qty } }
      : { id: item.productId, stock: { $gte: item.qty } };
    try {
      await products.updateOne(filterById, { $inc: { stock: -item.qty } });
    } catch (err) {
      console.warn(`[webhook] stock decrement failed for ${item.productId}:`, err.message);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'Failed to read body' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(raw)
    .digest('hex');

  let valid = false;
  try {
    valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    valid = false;
  }

  if (!valid) {
    console.warn('Razorpay webhook signature mismatch');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const orders = await getCollection(COLLECTIONS.ORDERS);
  const payments = await getCollection(COLLECTIONS.PAYMENTS);

  const entity = event.payload?.payment?.entity;
  const rpOrderId = entity?.order_id;
  const rpPaymentId = entity?.id;

  try {
    switch (event.event) {
      case 'payment.captured': {
        if (rpOrderId) {
          const updated = await orders.findOneAndUpdate(
            { razorpayOrderId: rpOrderId },
            {
              $set: {
                paymentStatus: 'paid',
                status: 'confirmed',
                razorpayPaymentId: rpPaymentId,
                paidAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { returnDocument: 'after', includeResultMetadata: false }
          );
          if (updated?._id) {
            await decrementStockOnce(orders, updated._id);
          }
        }
        break;
      }

      case 'payment.failed': {
        if (rpOrderId) {
          await orders.updateOne(
            { razorpayOrderId: rpOrderId },
            { $set: { paymentStatus: 'failed', updatedAt: new Date() } }
          );
        }
        break;
      }

      default:
        break;
    }

    await payments.insertOne({
      event: event.event,
      payload: event.payload,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[webhook] DB error:', err);
    return res.status(500).json({ error: 'Processing failed' });
  }

  return res.status(200).json({ received: true });
}