import { authenticate, ok, fail, parseBody, ensureUserDoc } from '../_lib/middleware.js';
import { requireAdmin } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  const quotes = await getCollection(COLLECTIONS.QUOTES);

  // POST /api/quotes — public (optionally authenticated)
  if (req.method === 'POST') {
    const body = parseBody(req);
    const { name, phone, email, requirement, location, message } = body;

    if (!name || !phone || !requirement) {
      return fail(res, 'name, phone and requirement are required');
    }

    const user = await authenticate(req);
    if (user) await ensureUserDoc(user);

    const doc = {
      uid: user?.uid || null,
      name,
      phone,
      email: email || null,
      requirement,
      location: location || null,
      message: message || null,
      status: 'new',
      createdAt: new Date(),
    };

    const result = await quotes.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  // GET /api/quotes — ADMIN ONLY
  if (req.method === 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return; // requireAdmin already sent response

    const items = await quotes.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return ok(res, items);
  }

  return fail(res, 'Method not allowed', 405);
}