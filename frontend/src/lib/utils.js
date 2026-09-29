// ============================================================
// MAXVOLT — frontend utilities
// ============================================================

export const CONFIG = {
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '917595941311',
  businessName: 'MAXVOLT',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'maxvolt.power@gmail.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '+91 7595941311',
};

/**
 * Parse a price value into { min, max, isRange, invalid, raw }.
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

  const parsed = nums.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  if (!parsed.length) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  const min = Math.min(...parsed);
  const max = Math.max(...parsed);

  return { min, max, isRange: max !== min, invalid: false, raw: value };
}

export function parsePriceToNumber(value) {
  const { min, invalid } = parsePrice(value);
  return invalid ? 0 : min || 0;
}

export function formatINR(num) {
  if (!Number.isFinite(num)) return 'Price on request';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export function formatPrice(value) {
  const { min, max, isRange, invalid } = parsePrice(value);
  if (invalid) return 'Price on request';
  if (isRange) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min);
}

export function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return ''; }
}

export function formatDateTime(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

export function openWhatsapp(message = null) {
  const defaultMsg =
    'Hello MAXVOLT, I need help choosing a battery/inverter/power solution. Please contact me.';
  const msg = message || defaultMsg;
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getWhatsappMessage(product = null) {
  if (product) {
    const price = formatPrice(product.discountedPrice || product.price);
    return `Hello MAXVOLT, I am interested in ${product.brand} ${product.model}${
      price !== 'Price on request' ? ` (${price})` : ''
    }. Please share the current price and availability.`;
  }
  return 'Hello MAXVOLT, I need help choosing a battery/inverter/power solution. Please contact me.';
}

// ------------------------------------------------------------
// Image resolution — must mirror api/_lib/mongodb.js
// ------------------------------------------------------------

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
  return `/assets/images/${s}`;
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

export function resolveProductImages(product) {
  if (!product) return [];
  const out = [];
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      const r = resolveImageString(img);
      if (r) out.push(r);
    }
  }
  if (out.length === 0) {
    const single = resolveImageString(product.image);
    if (single) out.push(single);
  }
  return out;
}

export function getAvailabilityClass(availability) {
  if (!availability) return 'availability-available';
  const a = String(availability).toLowerCase();
  if (a.includes('usually')) return 'availability-usually';
  if (a.includes('check') || a.includes('out of stock')) return 'availability-check';
  return 'availability-available';
}

export function debounce(fn, ms = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function initialsFrom(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const s = String(nameOrEmail).trim();
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][1] || parts[0][0]).toUpperCase();
}

export function scrollToId(id) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id.replace(/^#/, ''));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// Natural-language "needs" parser (used by the calculator)
// ------------------------------------------------------------
// Extracts appliance mentions, quantities and backup hours from a
// free-text sentence like:
//   "I want to run 2 fans, 4 lights and a fridge for 5 hours"
// Returns:
//   {
//     matched: [{ id, name, qty, watts, icon }],
//     hours: number|null,
//     watts: number,           // total continuous watt load
//     raw: string,
//     confidence: 0..1,        // how sure we are
//   }
// ============================================================

export const APPLIANCE_KEYWORDS = [
  { id: 'fan',       name: 'Ceiling Fan',       icon: '🌀', watts: 70,   aliases: ['fan', 'fans', 'ceiling fan', 'ceiling fans', 'pankha', 'pankhe'] },
  { id: 'light',     name: 'LED Light',         icon: '💡', watts: 12,   aliases: ['light', 'lights', 'led', 'leds', 'bulb', 'bulbs', 'lamp', 'lamps', 'batti'] },
  { id: 'tube',      name: 'Tube Light',        icon: '🔆', watts: 40,   aliases: ['tube light', 'tube lights', 'tubelight', 'tubelights', 'tube', 'tubes'] },
  { id: 'tv',        name: 'Television',        icon: '📺', watts: 110,  aliases: ['tv', 'television', 'tvs', 'televisions', 'led tv'] },
  { id: 'fridge',    name: 'Refrigerator',      icon: '🧊', watts: 180,  aliases: ['fridge', 'refrigerator', 'refrigerators', 'freezer', 'fridges'] },
  { id: 'router',    name: 'Wi-Fi Router',      icon: '📶', watts: 15,   aliases: ['router', 'wifi', 'wi-fi', 'wifi router', 'internet'] },
  { id: 'computer',  name: 'Desktop Computer',  icon: '💻', watts: 200,  aliases: ['computer', 'desktop', 'pc', 'computers', 'desktops', 'pcs'] },
  { id: 'laptop',    name: 'Laptop',            icon: '💻', watts: 60,   aliases: ['laptop', 'laptops', 'notebook'] },
  { id: 'ac',        name: 'Air Conditioner',   icon: '❄️', watts: 1500, aliases: ['ac', 'a.c', 'air conditioner', 'aircon', 'air con', 'acs'] },
  { id: 'microwave', name: 'Microwave',         icon: '📡', watts: 1200, aliases: ['microwave', 'microwaves', 'oven'] },
  { id: 'mixer',     name: 'Mixer / Grinder',   icon: '🥤', watts: 500,  aliases: ['mixer', 'mixers', 'grinder', 'grinders', 'mixie'] },
  { id: 'iron',      name: 'Iron',              icon: '👔', watts: 1000, aliases: ['iron', 'irons', 'press'] },
  { id: 'waterpump', name: 'Water Pump',        icon: '🚰', watts: 750,  aliases: ['water pump', 'water pumps', 'pump', 'pumps', 'motor', 'motors'] },
  { id: 'cctv',      name: 'CCTV Camera',       icon: '📹', watts: 10,   aliases: ['cctv', 'camera', 'cameras', 'cctv camera', 'surveillance'] },
  { id: 'printer',   name: 'Printer',           icon: '🖨️', watts: 300,  aliases: ['printer', 'printers'] },
];

const WORD_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  a: 1, an: 1, couple: 2, few: 3, 'a couple': 2,
};

function wordToNumber(word) {
  if (!word) return null;
  const w = word.toLowerCase().trim();
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  if (w in WORD_NUMBERS) return WORD_NUMBERS[w];
  return null;
}

/**
 * Try to find a number immediately before/after an alias match.
 * Examples:
 *   "2 fans"     → qty 2 (before)
 *   "fans 2"     → qty 2 (after)
 *   "a fridge"   → qty 1
 *   "fans"       → qty 1 (default)
 */
function extractQtyNear(text, aliasStart, aliasEnd) {
  // Look backwards up to 12 chars for "N " or word-number
  const before = text.slice(Math.max(0, aliasStart - 12), aliasStart);
  const beforeMatch = before.match(/(\d+|[a-z]+)\s*$/i);
  if (beforeMatch) {
    const n = wordToNumber(beforeMatch[1]);
    if (n !== null && n > 0 && n <= 50) return n;
  }

  // Look forwards: "fans 2" or "fans: 2"
  const after = text.slice(aliasEnd, aliasEnd + 8);
  const afterMatch = after.match(/^\s*[:\-]?\s*(\d+)\b/);
  if (afterMatch) {
    const n = parseInt(afterMatch[1], 10);
    if (n > 0 && n <= 50) return n;
  }

  return 1;
}

/**
 * Parse a free-text "needs" description into structured appliance data.
 */
export function parseNeedsText(rawText) {
  const raw = String(rawText || '').trim();
  const result = {
    matched: [],
    hours: null,
    watts: 0,
    raw,
    confidence: 0,
  };

  if (!raw) return result;

  const text = raw.toLowerCase();
  const claimedRanges = []; // to avoid double-matching overlapping aliases

  // --- Hours extraction ---
  // "for 4 hours", "4 hrs", "4h", "backup of 5 hours"
  const hoursMatch =
    text.match(/(?:for|backup(?:\s*of)?|about|around|approx(?:imately)?)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/) ||
    text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hoursMatch) {
    const h = parseFloat(hoursMatch[1]);
    if (h > 0 && h <= 72) result.hours = h;
  }

  // --- Appliance extraction ---
  for (const appliance of APPLIANCE_KEYWORDS) {
    // Sort aliases longest-first to prefer "tube light" over "light"
    const aliases = [...appliance.aliases].sort((a, b) => b.length - a.length);

    for (const alias of aliases) {
      // Word-boundary regex, escape special chars
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'gi');

      let match;
      while ((match = re.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Skip if overlaps a previous, longer match (e.g. "tube light" vs "light")
        const overlaps = claimedRanges.some(
          ([s, e]) => !(end <= s || start >= e)
        );
        if (overlaps) continue;

        claimedRanges.push([start, end]);

        const qty = extractQtyNear(text, start, end);
        const existing = result.matched.find((m) => m.id === appliance.id);
        if (existing) {
          existing.qty += qty;
        } else {
          result.matched.push({
            id: appliance.id,
            name: appliance.name,
            icon: appliance.icon,
            watts: appliance.watts,
            qty,
          });
        }
        break; // one alias match per appliance is enough
      }

      if (result.matched.find((m) => m.id === appliance.id)) break;
    }
  }

  // --- Totals ---
  result.watts = result.matched.reduce(
    (sum, m) => sum + m.qty * m.watts,
    0
  );

  // Confidence: how many meaningful signals we got
  let score = 0;
  if (result.matched.length > 0) score += 0.6;
  if (result.hours !== null) score += 0.3;
  if (result.watts >= 200) score += 0.1;
  result.confidence = Math.min(1, score);

  return result;
}