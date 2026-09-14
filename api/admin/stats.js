import { requireAdmin, ok } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

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
    ordersToday, ordersThisMonth, newQuotes,
    revenueAgg,
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
      users: totalUsers,
      products: totalProducts,
      orders: totalOrders,
      quotes: totalQuotes,
      revenue: revenueAgg[0]?.total || 0,
    },
    today: { orders: ordersToday },
    month: { orders: ordersThisMonth },
    pending: { newQuotes },
    recentOrders,
    recentQuotes,
  });
}