// ============================================================
// MAXVOLT — Chatbot API (Groq)
// ============================================================

import { getCollection, COLLECTIONS } from './_lib/mongodb.js';
import { authenticate } from './_lib/middleware.js';

// ---------- Simple in-memory rate limiter ----------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30; // per IP per minute
const rateMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateMap.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: RATE_MAX - 1 };
  }
  entry.count += 1;
  if (entry.count > RATE_MAX) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: RATE_MAX - entry.count };
}

// Prune occasionally
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap.entries()) {
    if (now - v.start > RATE_WINDOW_MS * 2) rateMap.delete(k);
  }
}, 5 * 60_000).unref?.();

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  // If the adapter already consumed the stream, req.rawBody has the buffer
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    try {
      return JSON.parse(req.rawBody.toString('utf8') || '{}');
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

const KNOWN_GOOD_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const DEFAULT_MODEL = KNOWN_GOOD_MODELS[0];

async function callGroq({ apiKey, model, messages }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      }
    );

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { _raw: raw };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

function extractReply(data) {
  if (!data || typeof data !== 'object') return null;
  const choice = Array.isArray(data.choices) ? data.choices[0] : null;
  if (choice) {
    const content = choice.message?.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    if (typeof choice.text === 'string' && choice.text.trim()) return choice.text.trim();
  }
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return res
      .status(429)
      .json({ success: false, error: 'Too many messages. Please slow down.' });
  }

  const body = await readBody(req);
  const { message, history = [], apiKeyOverride, modelOverride } = body;

  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res
      .status(400)
      .json({ success: false, error: 'Message is required (max 2000 chars).' });
  }

  // Only admins can pass overrides
  let isAdmin = false;
  if (apiKeyOverride || modelOverride) {
    try {
      const user = await authenticate(req);
      isAdmin = !!user?.isAdmin;
    } catch {
      isAdmin = false;
    }
  }

  // Resolve API key + model
  let apiKey = process.env.GROQ_API_KEY;
  let model = DEFAULT_MODEL;

  try {
    const settings = await getCollection(COLLECTIONS.SETTINGS);
    const doc = await settings.findOne({ key: 'chatbot' });
    if (doc?.value) {
      if (doc.value.chatApiKey && String(doc.value.chatApiKey).trim()) {
        apiKey = String(doc.value.chatApiKey).trim();
      }
      if (doc.value.chatModel && String(doc.value.chatModel).trim()) {
        model = String(doc.value.chatModel).trim();
      }
    }
  } catch (e) {
    console.warn('[chat] Could not load chatbot settings:', e.message);
  }

  if (isAdmin) {
    if (typeof apiKeyOverride === 'string' && apiKeyOverride.trim()) {
      apiKey = apiKeyOverride.trim();
    }
    if (typeof modelOverride === 'string' && modelOverride.trim()) {
      model = modelOverride.trim();
    }
  }

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error:
        'Chatbot API key is not configured. Set GROQ_API_KEY on the server or save it in Admin → Settings → Chatbot.',
    });
  }

  // Build product context
  let productContext = '';
  try {
    const products = await getCollection(COLLECTIONS.PRODUCTS);
    const items = await products
      .find({ active: { $ne: false } })
      .limit(50)
      .toArray();
    productContext = items
      .map(
        (p) =>
          `- ${p.brand || ''} ${p.model || ''} (${p.category || ''}): ${
            p.capacity || p.va || ''
          }, Price: ₹${p.discountedPrice || p.price || 'N/A'}, Stock: ${
            p.stock > 0 ? 'Available' : 'Out of Stock'
          }`
      )
      .join('\n');
  } catch (e) {
    console.warn('[chat] Could not fetch products for chatbot:', e.message);
  }

  const systemPrompt = `You are MAXVOLT Assistant, a helpful chatbot for MAXVOLT — a battery and power solutions company in Kolkata, India.
You help customers with:
- Product recommendations (inverter batteries, car batteries, TOTO/e-rickshaw batteries, e-bike batteries, UPS systems)
- Pricing and availability queries
- Technical specifications
- Order status (ask for order ID)
- General inquiries

Here are the currently available products:
${productContext || '(No products currently listed)'}

Company contact:
- Phone: +91 7595941311
- WhatsApp: +91 7595941311
- Email: maxvolt.power@gmail.com
- Location: Kolkata, West Bengal

Be concise, friendly, and helpful. Keep replies under 120 words unless detail is required.
If you don't know something, suggest contacting the team directly.
Never make up product details not in the list above.`;

  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(
      (h) =>
        h &&
        (h.role === 'user' || h.role === 'assistant') &&
        typeof h.content === 'string' &&
        h.content.length <= 2000
    )
    .slice(-6);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...safeHistory,
    { role: 'user', content: message.slice(0, 2000) },
  ];

  const modelsToTry = [model, ...KNOWN_GOOD_MODELS.filter((m) => m !== model)];
  const errors = [];

  for (const tryModel of modelsToTry) {
    try {
      console.log(`[chat] Trying Groq model: ${tryModel}`);
      const { ok, status, data } = await callGroq({
        apiKey,
        model: tryModel,
        messages,
      });

      if (!ok) {
        const upstream =
          data?.error?.message ||
          data?.message ||
          data?._raw ||
          `Groq HTTP ${status}`;
        console.warn(`[chat] Model "${tryModel}" failed:`, upstream);
        errors.push(`${tryModel}: ${upstream}`);
        // If it's an auth error, no point trying other models
        if (status === 401 || status === 403) break;
        continue;
      }

      const reply = extractReply(data);
      if (!reply) {
        console.warn(
          `[chat] Model "${tryModel}" returned empty reply. Raw:`,
          JSON.stringify(data).slice(0, 500)
        );
        errors.push(`${tryModel}: empty response`);
        continue;
      }

      console.log(`[chat] Success with model: ${tryModel}`);
      return res.status(200).json({
        success: true,
        data: { reply, model: tryModel },
      });
    } catch (err) {
      console.error(`[chat] Model "${tryModel}" threw:`, err);
      errors.push(`${tryModel}: ${err.message}`);
    }
  }

  console.error('[chat] All models failed:', errors);
  return res.status(500).json({
    success: false,
    error: `Chatbot failed. Details: ${errors.join(' | ')}`,
  });
}