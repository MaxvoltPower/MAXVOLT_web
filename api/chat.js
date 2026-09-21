import { getCollection, COLLECTIONS } from './_lib/mongodb.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// ---------------------------------------------------------------------------
// Verified working Groq models (late 2025).
// Order matters: the first one is the default when no model is configured.
// If the configured model fails, we try each of these in turn.
// ---------------------------------------------------------------------------
const KNOWN_GOOD_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const DEFAULT_MODEL = KNOWN_GOOD_MODELS[0];

/**
 * Call Groq's OpenAI-compatible endpoint.
 * Returns { ok, status, data } — never throws.
 */
async function callGroq({ apiKey, model, messages }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { _raw: raw };
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Extract the assistant's reply from a Groq/OpenAI-compatible response.
 * Returns null if nothing usable is found.
 */
function extractReply(data) {
  if (!data || typeof data !== 'object') return null;

  const choice = Array.isArray(data.choices) ? data.choices[0] : null;
  if (choice) {
    const content = choice.message?.content;
    if (typeof content === 'string' && content.trim()) return content.trim();

    // Some providers (not Groq, but just in case) use `text`
    if (typeof choice.text === 'string' && choice.text.trim()) return choice.text.trim();
  }

  // Newer OpenAI-style "output_text"
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const { message, history = [], apiKeyOverride, modelOverride } = body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // ---------- Resolve API key + model ----------
  let apiKey = process.env.GROQ_API_KEY;
  let model = DEFAULT_MODEL;

  // DB settings take precedence over env
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

  // Inline overrides (from admin "Test Chatbot") win over everything
  if (typeof apiKeyOverride === 'string' && apiKeyOverride.trim()) {
    apiKey = apiKeyOverride.trim();
  }
  if (typeof modelOverride === 'string' && modelOverride.trim()) {
    model = modelOverride.trim();
  }

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error:
        'Chatbot API key is not configured. Set GROQ_API_KEY on the server or save it in Admin → Settings → Chatbot.',
    });
  }

  // ---------- Build product context ----------
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

Be concise, friendly, and helpful. If you don't know something, suggest contacting the team directly.
Never make up product details not in the list above.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter(
        (h) =>
          h &&
          (h.role === 'user' || h.role === 'assistant') &&
          typeof h.content === 'string'
      )
      .slice(-6),
    { role: 'user', content: message },
  ];

  // ---------- Try configured model, then known-good fallbacks ----------
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
        continue; // try next model
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

  // All models failed
  console.error('[chat] All models failed:', errors);
  return res.status(500).json({
    success: false,
    error: `Chatbot failed. Details: ${errors.join(' | ')}`,
  });
}