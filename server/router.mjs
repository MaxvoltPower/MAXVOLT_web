// server/router.mjs
// Maps incoming HTTP requests to Vercel-style handler files in /api.
// Mimics Vercel's routing so files like api/auth.js handle /api/auth/verify,
// /api/auth/profile, etc. — including setting req.query.path the same way
// Vercel does for catch-all-style handlers.

import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

const API_DIR = path.resolve(process.cwd(), 'api');

// Top-level API "entry points" (files directly in api/*.js).
// These are the modules Vercel would deploy as functions.
const API_ENTRY_FILES = [
  'admin',
  'auth',
  'categories',
  'chat',
  'config',
  'contact',
  'orders',
  'payments',
  'products',
  'quotes',
  'reviews',
  'sections',
  'webhook',
];

// Cache loaded modules so we don't re-import on every request.
const moduleCache = new Map();

async function loadHandlerModule(name) {
  if (moduleCache.has(name)) return moduleCache.get(name);

  const filePath = path.join(API_DIR, `${name}.js`);
  if (!fs.existsSync(filePath)) {
    moduleCache.set(name, null);
    return null;
  }

  const fileUrl = pathToFileURL(filePath).href;
  const mod = await import(fileUrl);
  moduleCache.set(name, mod);
  return mod;
}

/**
 * Given a pathname like "/api/auth/profile", return:
 *   { entry: 'auth', segments: ['profile'] }
 * or null if no matching entry file exists.
 */
function matchApiRoute(pathname) {
  // Strip leading slash, split
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);

  // Must start with "api"
  if (parts[0] !== 'api') return null;

  const rest = parts.slice(1);
  if (rest.length === 0) return null;

  const entry = rest[0];
  if (!API_ENTRY_FILES.includes(entry)) return null;

  return {
    entry,
    segments: rest.slice(1), // e.g. ['profile'] for /api/auth/profile
  };
}

/**
 * Main dispatcher. Returns true if the request was handled, false otherwise.
 */
export async function dispatchApiRequest(req, res) {
  const urlPath = (req.url || '/').split('?')[0];
  const match = matchApiRoute(urlPath);

  if (!match) return false;

  const mod = await loadHandlerModule(match.entry);
  if (!mod) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: `No API handler found for /api/${match.entry}`,
      })
    );
    return true;
  }

  // Inject req.query.path like Vercel does for dynamic routes.
  // Note: our adapter already populated req.query from the URL.
  // We merge the path segments in, preserving any real query params.
  if (match.segments.length > 0) {
    req.query = req.query || {};
    // Vercel gives an array for catch-all; our handlers accept both.
    req.query.path = match.segments.length === 1
      ? match.segments[0]
      : match.segments;
  }

  const { runVercelHandler } = await import('./vercel-adapter.mjs');
  await runVercelHandler(mod, req, res);
  return true;
}

/**
 * List of available API entries (useful for logging at startup).
 */
export function listApiEntries() {
  return API_ENTRY_FILES.filter((name) =>
    fs.existsSync(path.join(API_DIR, `${name}.js`))
  );
}