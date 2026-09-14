import { requireAdmin, ok, fail, parseBody } from '../_lib/middleware.js';
import { getCollection, COLLECTIONS } from '../_lib/mongodb.js';

const SETTINGS_KEY = 'site';

export default async function handler(req, res) {
  const settings = await getCollection(COLLECTIONS.SETTINGS);

  if (req.method === 'GET') {
    // Public read — no auth required
    const doc = await settings.findOne({ key: SETTINGS_KEY });
    return ok(res, doc?.value || {});
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = parseBody(req);
    await settings.updateOne(
      { key: SETTINGS_KEY },
      { $set: { key: SETTINGS_KEY, value: body, updatedAt: new Date(), updatedBy: admin.uid } },
      { upsert: true }
    );
    return ok(res, body);
  }

  return fail(res, 'Method not allowed', 405);
}