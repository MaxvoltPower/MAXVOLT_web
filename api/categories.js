// ============================================================
// MAXVOLT — Categories API
// ============================================================
//  GET    /api/categories       → list (public: only active)
//                                 (admin: all, with ?all=1)
//  POST   /api/categories       → create (admin)
//  GET    /api/categories/:id   → single (admin)
//  PUT    /api/categories/:id   → update (admin)
//  DELETE /api/categories/:id   → delete (admin)
// ============================================================

import {
  requireAdmin,
  ok,
  fail,
  parseBody,
  authenticate,
  getPathSegments,
} from './_lib/middleware.js';
import { getCollection } from './_lib/mongodb.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'categories';

/** Slugify a name into a URL-safe key: "Home Inverter Batteries" → "homeInverterBatteries" */
function toSlug(input) {
  if (!input) return '';
  const words = String(input)
    .trim()
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  return words
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
}

export default async function handler(req, res) {
  const segments = getPathSegments(req, 'categories');
  const id = segments[0];
  const method = req.method;
  const categories = await getCollection(COLLECTION);

  console.log(
    `[categories] ${method} id=${id || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

  // ---- GET /api/categories ----  (public read of active ones)
  if (!id && method === 'GET') {
    let isAdmin = false;
    try {
      const user = await authenticate(req);
      isAdmin = !!user?.isAdmin;
    } catch {
      isAdmin = false;
    }

    const { all } = req.query;
    const query = isAdmin && all === '1' ? {} : { active: { $ne: false } };

    const items = await categories.find(query).sort({ order: 1, name: 1 }).toArray();
    return ok(res, items);
  }

  // Everything below requires admin
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // ---- GET /api/categories/:id ----
  if (id && method === 'GET') {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid category ID');
    const doc = await categories.findOne({ _id: new ObjectId(id) });
    if (!doc) return fail(res, 'Category not found', 404);
    return ok(res, doc);
  }

  // ---- POST /api/categories ----
  if (!id && method === 'POST') {
    const body = parseBody(req);
    const { name, slug, description, image, icon, order, active } = body;
    if (!name || !String(name).trim()) return fail(res, 'name is required');

    const finalSlug = slug && String(slug).trim()
      ? String(slug).trim()
      : toSlug(name);

    if (!finalSlug) return fail(res, 'Could not generate a valid slug from name');

    const existing = await categories.findOne({ slug: finalSlug });
    if (existing) return fail(res, `Category with slug "${finalSlug}" already exists`, 409);

    const doc = {
      name: String(name).trim(),
      slug: finalSlug,
      description: description ? String(description).trim() : '',
      image: image ? String(image).trim() : '',
      icon: icon ? String(icon).trim() : '📦',
      order: Number.isFinite(Number(order)) ? Number(order) : 999,
      active: active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await categories.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  // ---- PUT/PATCH /api/categories/:id ----
  if (id && (method === 'PUT' || method === 'PATCH')) {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid category ID');
    const _id = new ObjectId(id);
    const body = parseBody(req);

    const update = {};
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const s = String(body.slug).trim();
      if (s) {
        const clash = await categories.findOne({ slug: s, _id: { $ne: _id } });
        if (clash) return fail(res, `Slug "${s}" is already in use`, 409);
        update.slug = s;
      }
    }
    if (body.description !== undefined) update.description = String(body.description).trim();
    if (body.image !== undefined) update.image = String(body.image).trim();
    if (body.icon !== undefined) update.icon = String(body.icon).trim();
    if (body.order !== undefined) update.order = Number(body.order) || 0;
    if (body.active !== undefined) update.active = body.active !== false;
    update.updatedAt = new Date();

    const result = await categories.findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!result) return fail(res, 'Category not found', 404);
    return ok(res, result);
  }

  // ---- DELETE /api/categories/:id ----
  if (id && method === 'DELETE') {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid category ID');
    const _id = new ObjectId(id);

    const cat = await categories.findOne({ _id });
    if (!cat) return fail(res, 'Category not found', 404);

    // Block deletion if products still reference this slug
    const products = await getCollection('products');
    const inUse = await products.countDocuments({ category: cat.slug });
    if (inUse > 0) {
      return fail(
        res,
        `Cannot delete "${cat.name}" — ${inUse} product(s) still use this category. Reassign or delete them first.`,
        400
      );
    }

    await categories.deleteOne({ _id });
    return ok(res, { deleted: true });
  }

  return fail(res, 'Not found', 404);
}

export { toSlug };