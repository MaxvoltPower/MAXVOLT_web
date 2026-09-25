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

const SECTIONS_COLLECTION = 'sections';
const CATEGORIES_COLLECTION = 'categories';

/**
 * Router for /api/sections/*
 *   GET    /api/sections      → list active sections (public)
 *                               admins see all with ?all=1
 *   POST   /api/sections      → create (admin)
 *   PUT    /api/sections/:id  → update (admin)
 *   DELETE /api/sections/:id  → delete (admin)
 *
 * Router for /api/categories/*  (folded in to stay under Hobby plan function limit)
 *   GET    /api/categories     → list (public: only active; admin: all with ?all=1)
 *   POST   /api/categories     → create (admin)
 *   GET    /api/categories/:id → single (admin)
 *   PUT    /api/categories/:id → update (admin)
 *   DELETE /api/categories/:id → delete (admin)
 */
export default async function handler(req, res) {
  const rawUrl = (req.url || '').split('?')[0];
  if (rawUrl.startsWith('/api/categories')) {
    return handleCategories(req, res);
  }
  const segments = getPathSegments(req, 'sections');
  const first = segments[0] || '';
  if (first === 'categories') {
    return handleCategories(req, res);
  }
  return handleSections(req, res, segments);
}

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------
async function handleSections(req, res, segments) {
  const id = segments[0];
  const col = await getCollection(SECTIONS_COLLECTION);

  console.log(
    `[sections] ${req.method} id=${id || '(root)'} url=${req.url} path=${JSON.stringify(
      req.query?.path
    )}`
  );

  if (req.method === 'GET' && !id) {
    let isAdmin = false;
    try {
      const user = await authenticate(req);
      isAdmin = !!user?.isAdmin;
    } catch {
      isAdmin = false;
    }

    const query = isAdmin ? {} : { active: { $ne: false } };
    const sections = await col.find(query).sort({ order: 1 }).toArray();
    return ok(res, sections);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (id) {
    if (!ObjectId.isValid(id)) return fail(res, 'Invalid ID');
    const _id = new ObjectId(id);
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = parseBody(req);
      const result = await col.findOneAndUpdate(
        { _id },
        { $set: { ...body, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return ok(res, result);
    }
    if (req.method === 'DELETE') {
      await col.deleteOne({ _id });
      return ok(res, { deleted: true });
    }
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    if (!body.title || !body.type) return fail(res, 'title and type required');
    const doc = { ...body, createdAt: new Date(), updatedAt: new Date() };
    const result = await col.insertOne(doc);
    return ok(res, { _id: result.insertedId, ...doc }, 201);
  }

  return fail(res, 'Not found', 404);
}

// ------------------------------------------------------------
// Categories (folded in from api/categories.js)
// ------------------------------------------------------------
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

async function handleCategories(req, res) {
  const segments = getPathSegments(req, 'categories');
  const id = segments[0];
  const method = req.method;
  const categories = await getCollection(CATEGORIES_COLLECTION);

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