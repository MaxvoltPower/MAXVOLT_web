import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'maxvolt';

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Alias for connectDB that mirrors the old public name.
 * Prefer getDb() when you need the raw MongoClient (transactions, sessions).
 */
export async function getDb() {
  return connectDB();
}

export async function getCollection(name) {
  const { db } = await connectDB();
  return db.collection(name);
}

// Collections: users, products, categories, orders, quotes, payments, settings, contacts
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  QUOTES: 'quotes',
  PAYMENTS: 'payments',
  SETTINGS: 'settings',
  CONTACTS: 'contacts',
};

// ------- Product numeric helpers -------

export function parsePrice(value) {
  if (value === null || value === undefined) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { min: value, max: value, isRange: false, invalid: false, raw: value };
  }
  const str = String(value).trim();
  if (!str) return { min: 0, max: 0, isRange: false, invalid: true, raw: value };

  const nums = str.replace(/[₹,\s]/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  const parsed = nums.map(Number).filter(Number.isFinite);
  if (!parsed.length) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  const min = Math.min(...parsed);
  const max = Math.max(...parsed);
  return { min, max, isRange: max !== min, invalid: false, raw: value };
}

export function extractNumber(input) {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const m = String(input).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

export function parseVaToNumber(product) {
  if (!product) return 0;
  if (typeof product.vaNumeric === 'number' && Number.isFinite(product.vaNumeric)) {
    return product.vaNumeric;
  }
  const raw = product.va;
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (!s) return 0;

  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*k\s*va/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  const vaMatch = s.match(/(\d+(?:\.\d+)?)\s*va/i);
  if (vaMatch) return parseFloat(vaMatch[1]);

  return extractNumber(s);
}

export function parseAhToNumber(product) {
  if (!product) return 0;
  if (typeof product.capacityAh === 'number' && Number.isFinite(product.capacityAh)) {
    return product.capacityAh;
  }
  const raw = product.capacity;
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (!s) return 0;

  const ahMatch = s.match(/(\d+(?:\.\d+)?)\s*ah/i);
  if (ahMatch) return parseFloat(ahMatch[1]);

  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(...nums.map(Number));
}

// ------- Product image helpers (base64 stored directly in Mongo) -------

const JUNK_STRINGS = new Set([
  '',
  'undefined',
  'null',
  'nan',
  'false',
  'none',
  '[object object]',
]);

function isJunkImageString(s) {
  if (typeof s !== 'string') return true;
  const t = s.trim();
  if (!t) return true;
  return JUNK_STRINGS.has(t.toLowerCase());
}

export function normalizeImageInput(input) {
  if (input === undefined || input === null) return { ok: true, value: null };
  if (typeof input !== 'string') {
    return { ok: true, value: null };
  }
  const s = input.trim();
  if (isJunkImageString(s)) return { ok: true, value: null };

  if (s.startsWith('data:image/')) {
    if (s.length > 2_500_000) {
      return { ok: false, error: 'Image too large (max ~1.8 MB after compression)' };
    }
    if (!/;base64,/i.test(s)) {
      return { ok: true, value: s };
    }
    const match = s.match(
      /^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif|bmp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/_=-]+$/i
    );
    if (!match) {
      return {
        ok: false,
        error: 'Unsupported image format. Use PNG, JPG, WEBP, GIF, SVG or AVIF.',
      };
    }
    return { ok: true, value: s };
  }

  if (s.startsWith('blob:')) return { ok: true, value: s };
  if (s.startsWith('//')) return { ok: true, value: s };
  if (/^https?:\/\//i.test(s)) return { ok: true, value: s };
  if (s.startsWith('/')) return { ok: true, value: s };
  if (s.startsWith('assets/')) return { ok: true, value: '/' + s };
  if (s.startsWith('../')) return { ok: true, value: s.replace(/^\.\.\//, '/') };
  if (/^[A-Za-z0-9_\-.\s]+$/.test(s)) {
    return { ok: true, value: `assets/images/${s}` };
  }
  return { ok: false, error: 'Invalid image reference' };
}

function resolveImageString(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') return null;

  const s = raw.trim();
  if (isJunkImageString(s)) return null;

  if (s.startsWith('data:')) return s;
  if (s.startsWith('blob:')) return s;
  if (s.startsWith('//')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  if (s.startsWith('assets/')) return '/' + s;
  if (s.startsWith('../')) return s.replace(/^\.\.\//, '/');
  return '/assets/images/' + s;
}

export function resolveProductImage(productOrString) {
  if (!productOrString) return null;

  if (typeof productOrString === 'string') {
    return resolveImageString(productOrString);
  }

  if (Array.isArray(productOrString.images) && productOrString.images.length > 0) {
    for (const candidate of productOrString.images) {
      const resolved = resolveImageString(candidate);
      if (resolved) return resolved;
    }
  }

  return resolveImageString(productOrString.image);
}

export function normalizeImageArray(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const raw of input) {
    const norm = normalizeImageInput(raw);
    if (norm.ok && norm.value) out.push(norm.value);
  }
  return out;
}