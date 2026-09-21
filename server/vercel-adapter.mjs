// server/vercel-adapter.mjs
// Wraps Vercel-style serverless handlers so they can run on a plain Node HTTP server.
// It adds: req.body, req.query, res.status(), res.json(), res.send(), res.end(),
// res.setHeader() passthrough, and a normalized req.url / req.method.

import { URL } from 'url';

/**
 * Parse the query string from a URL into a plain object.
 * Repeated keys become arrays (matching Vercel's behavior).
 */
function parseQuery(urlString) {
  const url = new URL(urlString, 'http://localhost');
  const query = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key in query) {
      if (Array.isArray(query[key])) query[key].push(value);
      else query[key] = [query[key], value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

/**
 * Read the raw body from the incoming request as a Buffer.
 */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Enhance a Node req object with Vercel-like fields and a raw body Buffer.
 * Returns the raw body so the caller can decide whether to JSON-parse it.
 */
async function decorateRequest(req) {
  const rawBody = await readRawBody(req);

  // Preserve raw body for webhook signature verification
  req.rawBody = rawBody;

  // Parse JSON body if content-type says so (and not empty)
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (rawBody.length > 0 && contentType.includes('application/json')) {
    try {
      req.body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      req.body = {};
    }
  } else if (rawBody.length > 0) {
    // Non-JSON body: keep as string (some handlers read req.body as string)
    req.body = rawBody.toString('utf8');
  } else {
    req.body = {};
  }

  // Query params (Vercel provides this)
  req.query = parseQuery(req.url || '/');

  // Vercel provides req.cookies; give a minimal shim
  req.cookies = req.cookies || {};

  return rawBody;
}

/**
 * Enhance a Node res object with Vercel-like helpers.
 */
function decorateResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (payload) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = function (payload) {
    if (payload === undefined || payload === null) {
      res.end();
      return res;
    }
    if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      return res.json(payload);
    }
    res.end(payload);
    return res;
  };

  res.redirect = function (statusOrUrl, maybeUrl) {
    if (typeof statusOrUrl === 'string') {
      res.statusCode = 302;
      res.setHeader('Location', statusOrUrl);
    } else {
      res.statusCode = statusOrUrl;
      res.setHeader('Location', maybeUrl);
    }
    res.end();
    return res;
  };

  return res;
}

/**
 * Run a Vercel handler given a Node req/res.
 * Handles both default exports and named `handler` exports.
 */
export async function runVercelHandler(handlerModule, req, res) {
  const handler =
    handlerModule?.default ||
    handlerModule?.handler ||
    handlerModule;

  if (typeof handler !== 'function') {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Handler is not a function' }));
    return;
  }

  await decorateRequest(req);
  decorateResponse(res);

  try {
    await handler(req, res);
  } catch (err) {
    console.error('[vercel-adapter] Handler error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: err?.message || 'Internal server error',
        })
      );
    }
  }
}