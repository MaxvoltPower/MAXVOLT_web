// server/index.mjs
// Standalone local backend for MAXVOLT.
// Runs all Vercel serverless handlers in api/ on a single Node HTTP server.
//
// Usage:
//   node server/index.mjs
//   or via npm script:  npm run dev:api
//
// Default port: 3001 (override with PORT env var)

import http from 'http';
import 'dotenv/config';
import { dispatchApiRequest, listApiEntries } from './router.mjs';

const PORT = Number(process.env.PORT) || 3001;

// ---- CORS (dev only) ----
// Allows the Vite dev server (http://localhost:3000) to call this API directly.
// In production, Vercel serves both from the same origin, so no CORS needed.
function applyCors(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, x-razorpay-signature'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();

  applyCors(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];

  // ---- Health check ----
  if (urlPath === '/api/health' || urlPath === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        service: 'maxvolt-api',
        time: new Date().toISOString(),
        handlers: listApiEntries(),
      })
    );
    return;
  }

  // ---- API dispatch ----
  try {
    const handled = await dispatchApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: `Not found: ${req.method} ${urlPath}`,
          hint: 'API routes must start with /api/<entry> where <entry> is one of: ' +
            listApiEntries().join(', '),
        })
      );
    }
  } catch (err) {
    console.error('[server] Unhandled error:', err);
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
  } finally {
    const ms = Date.now() - start;
    console.log(
      `[api] ${req.method} ${urlPath} → ${res.statusCode} (${ms}ms)`
    );
  }
});

server.listen(PORT, () => {
  const entries = listApiEntries();
  console.log('');
  console.log('  ⚡ MAXVOLT — local backend');
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  ➜  Health: http://localhost:${PORT}/api/health`);
  console.log(`  ➜  Handlers: ${entries.join(', ')}`);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\n[server] Received ${sig}, shutting down...`);
    server.close(() => process.exit(0));
  });
}