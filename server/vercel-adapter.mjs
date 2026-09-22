// server/vercel-adapter.mjs
// Wraps Vercel-style serverless handlers so they can run on a plain Node HTTP server.

import { URL } from 'url';

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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function decorateRequest(req) {
  // Only read if not already read
  let rawBody = req.rawBody;
  if (!Buffer.isBuffer(rawBody)) {
    rawBody = await readRawBody(req);
    req.rawBody = rawBody;
  }

  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (rawBody.length > 0 && contentType.includes('application/json')) {
    try {
      req.body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      req.body = {};
    }
  } else if (rawBody.length > 0 && !req.body) {
    req.body = rawBody.toString('utf8');
  } else if (!req.body) {
    req.body = {};
  }

  req.query = req.query || parseQuery(req.url || '/');
  req.cookies = req.cookies || {};

  return rawBody;
}

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

export async function runVercelHandler(handlerModule, req, res) {
  const handler = handlerModule?.default || handlerModule?.handler || handlerModule;

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