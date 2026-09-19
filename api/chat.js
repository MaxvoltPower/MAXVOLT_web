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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const { message, history = [] } = body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let apiKey = process.env.GROQ_API_KEY;
  let model = 'llama3-70b-8192';

  try {
    const settings = await getCollection(COLLECTIONS.SETTINGS);
    const doc = await settings.findOne({ key: 'chatbot' });
    if (doc?.value) {
      if (doc.value.chatApiKey) apiKey = doc.value.chatApiKey;
      if (doc.value.chatModel) model = doc.value.chatModel;
    }
  } catch (e) {
    console.warn('Could not load chatbot settings:', e.message);
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Chatbot API key not configured.' });
  }

  let productContext = '';
  try {
    const products = await getCollection(COLLECTIONS.PRODUCTS);
    const items = await products.find({ active: { $ne: false } }).limit(50).toArray();
    productContext = items.map(p =>
      `- ${p.brand} ${p.model} (${p.category}): ${p.capacity || p.va || ''}, Price: ₹${p.discountedPrice || p.price}, Stock: ${p.stock > 0 ? 'Available' : 'Out of Stock'}`
    ).join('\n');
  } catch (e) {
    console.warn('Could not fetch products for chatbot:', e.message);
  }

  const systemPrompt = `You are MAXVOLT Assistant, a helpful chatbot for MAXVOLT — a battery and power solutions company in Kolkata, India.
You help customers with:
- Product recommendations (inverter batteries, car batteries, TOTO/e-rickshaw batteries, e-bike batteries, UPS systems)
- Pricing and availability queries
- Technical specifications
- Order status (ask for order ID)
- General inquiries

Here are the currently available products:
${productContext}

Company contact:
- Phone: +91 7595941311
- WhatsApp: +91 7595941311
- Email: maxvolt.power@gmail.com
- Location: Kolkata, West Bengal

Be concise, friendly, and helpful. If you don't know something, suggest contacting the team directly.
Never make up product details not in the list above.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({ error: err.message || 'Chatbot failed' });
  }
}