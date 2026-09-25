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

/**
 * Parse a price value into { min, max, isRange, invalid, raw }.
 * Mirrors frontend/src/lib/utils.js parsePrice().
 */
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

/**
 * Extract the first integer found in a string.
 * "700VA" → 700, "12V / 160Ah" → 12, "" → 0
 */
export function extractNumber(input) {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const m = String(input).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/**
 * Parse VA from a product. Prefers `vaNumeric` if set, falls back to parsing `va`.
 * Handles "700VA", "650VA / 360W", "0.7kVA", "1.5 kVA".
 */
export function parseVaToNumber(product) {
  if (!product) return 0;
  if (typeof product.vaNumeric === 'number' && Number.isFinite(product.vaNumeric)) {
    return product.vaNumeric;
  }
  const raw = product.va;
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (!s) return 0;

  // Handle kVA suffix
  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*k\s*va/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  // Handle plain VA
  const vaMatch = s.match(/(\d+(?:\.\d+)?)\s*va/i);
  if (vaMatch) return parseFloat(vaMatch[1]);

  // Fallback: first number
  return extractNumber(s);
}

/**
 * Parse battery capacity (Ah) from a product.
 * Prefers `capacityAh` if set, falls back to parsing `capacity`.
 * Handles "150Ah", "12V / 160Ah", "12V / 105Ah", "120 Ah".
 */
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

  // If no "Ah" suffix, take the largest number (handles "12V / 160" → 160)
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(...nums.map(Number));
}

// ------- Product image helpers (base64 stored directly in Mongo) -------
// Images are stored as data URLs (data:image/png;base64,...) in product.image
// This avoids needing an external file storage service.

/**
 * Validate & normalise an incoming image value.
 * Accepts:
 *   - "" / null / undefined           -> returns null
 *   - "data:image/...;base64,..."     -> validated, returned as-is
 *   - "/assets/images/foo.jpg"        -> treated as a static asset path
 *   - "http(s)://..."                 -> external URL
 * Returns { ok: boolean, value: string|null, error?: string }
 */
export function normalizeImageInput(input) {
  if (input === undefined || input === null) return { ok: true, value: null };
  const s = String(input).trim();
  if (!s) return { ok: true, value: null };

  // Data URL
  if (s.startsWith('data:image/')) {
    // Cap size to ~2.5MB base64 (roughly 1.8MB binary)
    if (s.length > 2_500_000) {
      return { ok: false, error: 'Image too large (max ~1.8 MB after compression)' };
    }
    const match = s.match(/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/);
    if (!match) return { ok: false, error: 'Unsupported image format. Use PNG, JPG, WEBP, GIF or SVG.' };
    return { ok: true, value: s };
  }

  // External / relative URL
  if (/^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('assets/') || s.startsWith('../')) {
    return { ok: true, value: s };
  }

  // Bare filename -> assume it lives in assets/images/
  if (/^[A-Za-z0-9_\-.\s]+$/.test(s)) {
    return { ok: true, value: `assets/images/${s}` };
  }

  return { ok: false, error: 'Invalid image reference' };
}

/**
 * Resolve a product's image field for public consumption.
 * Returns a string usable directly in <img src="...">.
 */
export function resolveProductImage(product) {
  if (!product || !product.image) return null;
  const img = product.image;
  if (typeof img !== 'string') return null;
  const s = img.trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;             // base64
  if (/^https?:\/\//i.test(s)) return s;           // external
  if (s.startsWith('/')) return s;                 // absolute path
  if (s.startsWith('assets/')) return '/' + s;     // normalise
  return '/assets/images/' + s;                    // bare filename → assets/images
}