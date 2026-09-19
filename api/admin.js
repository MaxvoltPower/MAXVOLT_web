import { requireAdmin, ok, fail, parseBody } from './_lib/middleware.js';
import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { setUserRole } from './_lib/firebase-admin.js';

const SETTINGS_KEY = 'site';

/**
 * Router for /api/admin/*
 *  GET   /api/admin/stats
 *  GET   /api/admin/users?q=
 *  PATCH /api/admin/users            (body: { uid, role })
 *  GET   /api/admin/settings
 *  PUT   /api/admin/settings
 */
export default async function handler(req, res) {
  const segments = getPathSegments(req, 'admin');
  const action = segments[0] || '';
  const method = req.method;

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // ---- /api/admin/stats ----
  if (action === 'stats' && method === 'GET') {
    const [users, products, orders, quotes] = await Promise.all([
      getCollection(COLLECTIONS.USERS),
      getCollection(COLLECTIONS.PRODUCTS),
      getCollection(COLLECTIONS.ORDERS),
      getCollection(COLLECTIONS.QUOTES),
    ]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalProducts, totalOrders, totalQuotes,
      ordersToday, ordersThisMonth, newQuotes, revenueAgg,
    ] = await Promise.all([
      users.countDocuments(),
      products.countDocuments({ active: { $ne: false } }),
      orders.countDocuments(),
      quotes.countDocuments(),
      orders.countDocuments({ createdAt: { $gte: startOfDay } }),
      orders.countDocuments({ createdAt: { $gte: startOfMonth } }),
      quotes.countDocuments({ status: 'new' }),
      orders.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).toArray(),
    ]);

    const recentOrders = await orders.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    const recentQuotes = await quotes.find({}).sort({ createdAt: -1 }).limit(5).toArray();

    return ok(res, {
      totals: {
        users: totalUsers, products: totalProducts, orders: totalOrders,
        quotes: totalQuotes, revenue: revenueAgg[0]?.total || 0,
      },
      today: { orders: ordersToday },
      month: { orders: ordersThisMonth },
      pending: { newQuotes },
      recentOrders,
      recentQuotes,
    });
  }

  // ---- /api/admin/users ----
  if (action === 'users') {
    const users = await getCollection(COLLECTIONS.USERS);
    if (method === 'GET') {
      const { q } = req.query;
      const query = q
        ? { $or: [{ email: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }] }
        : {};
      const items = await users.find(query).sort({ createdAt: -1 }).limit(200).toArray();
      return ok(res, items);
    }
    if (method === 'PATCH') {
      const { uid, role } = parseBody(req);
      if (!uid || !role) return fail(res, 'uid and role required');
      if (!['admin', 'customer'].includes(role)) return fail(res, 'Invalid role');
      await setUserRole(uid, role);
      await users.updateOne({ uid }, { $set: { role, updatedAt: new Date() } });
      return ok(res, { uid, role });
    }
    return fail(res, 'Method not allowed', 405);
  }

  // ---- /api/admin/settings ----
  if (action === 'settings') {
    const settings = await getCollection(COLLECTIONS.SETTINGS);

    if (method === 'GET') {
      const doc = await settings.findOne({ key: SETTINGS_KEY });
      const chatbot = await settings.findOne({ key: 'chatbot' });
      return ok(res, { ...(doc?.value || {}), ...(chatbot?.value || {}) });
    }
    if (method === 'PUT' || method === 'PATCH') {
      const body = parseBody(req);
      const chatKeys = ['chatApiKey', 'chatModel'];
      const chatValue = {};
      const siteValue = {};
      for (const k in body) {
        if (chatKeys.includes(k)) chatValue[k] = body[k];
        else siteValue[k] = body[k];
      }
      if (Object.keys(siteValue).length) {
        await settings.updateOne(
          { key: SETTINGS_KEY },
          { $set: { key: SETTINGS_KEY, value: siteValue, updatedAt: new Date(), updatedBy: admin.uid } },
          { upsert: true }
        );
      }
      if (Object.keys(chatValue).length) {
        await settings.updateOne(
          { key: 'chatbot' },
          { $set: { key: 'chatbot', value: chatValue, updatedAt: new Date(), updatedBy: admin.uid } },
          { upsert: true }
        );
      }
      return ok(res, body);
    }
    return fail(res, 'Method not allowed', 405);
  }

  return fail(res, 'Not found', 404);
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