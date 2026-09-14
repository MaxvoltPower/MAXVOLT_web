import { requireAuth, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';
import { ObjectId } from 'mongodb';

const VALID_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!ObjectId.isValid(id)) return fail(res, 'Invalid order ID');

  const orders = await getCollection(COLLECTIONS.ORDERS);
  const _id = new ObjectId(id);

  if (req.method === 'GET') {
    const query = user.isAdmin ? { _id } : { _id, uid: user.uid };
    const doc = await orders.findOne(query);
    if (!doc) return fail(res, 'Order not found', 404);
    return ok(res, doc);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = parseBody(req);
    const update = {};

    if (user.isAdmin) {
      if (body.status) {
        if (!VALID_STATUSES.includes(body.status)) return fail(res, 'Invalid status');
        update.status = body.status;
      }
      if (body.paymentStatus) update.paymentStatus = body.paymentStatus;
      if (body.trackingId) update.trackingId = body.trackingId;
      if (body.adminNotes) update.adminNotes = body.adminNotes;
    } else {
      // Customer can only cancel a placed order
      if (body.status === 'cancelled') {
        const existing = await orders.findOne({ _id, uid: user.uid });
        if (!existing) return fail(res, 'Order not found', 404);
        if (existing.status !== 'placed') {
          return fail(res, 'Only placed orders can be cancelled');
        }
        update.status = 'cancelled';
      } else {
        return fail(res, 'Unauthorized update');
      }
    }

    update.updatedAt = new Date();
    const result = await orders.findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after' });
    return ok(res, result);
  }

  return fail(res, 'Method not allowed', 405);
}