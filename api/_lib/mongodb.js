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
  if (img.startsWith('data:')) return img;         // base64
  if (/^https?:\/\//i.test(img)) return img;       // external
  if (img.startsWith('/')) return img;             // absolute path
  if (img.startsWith('assets/')) return '/' + img; // normalise
  return '/' + img;                                // bare filename fallback
}