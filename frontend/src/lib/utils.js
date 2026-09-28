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
  // Explicit null/undefined → invalid
  if (value === null || value === undefined) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }

  // Numeric 0 is a valid price
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { min: value, max: value, isRange: false, invalid: false, raw: value };
  }

  const str = String(value).trim();
  if (!str) return { min: 0, max: 0, isRange: false, invalid: true, raw: value };

  // Extract all numbers (strip currency symbols, commas, spaces)
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

/**
 * Resolve a single image reference string into a usable <img src>.
 * Returns null for junk.
 */
function resolveImageString(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') return null;

  const s = raw.trim();
  if (isJunkImageString(s)) return null;

  if (s.startsWith('data:')) return s;              // base64 / svg data URL
  if (s.startsWith('blob:')) return s;              // browser blob URL
  if (s.startsWith('//')) return s;                 // protocol-relative
  if (/^https?:\/\//i.test(s)) return s;            // external URL
  if (s.startsWith('/')) return s;                  // absolute path
  if (s.startsWith('assets/')) return '/' + s;      // normalise
  if (s.startsWith('../')) return s.replace(/^\.\.\//, '/');
  return `/assets/images/${s}`;                     // bare filename → assets/images
}

/**
 * Resolve a product's image reference into a usable <img src>.
 * Accepts EITHER:
 *   - a product object (reads `.images[0]` then `.image`)
 *   - a string (treated as a single image reference)
 * Returns null if no usable image — components should render a placeholder.
 */
export function resolveProductImage(productOrString) {
  if (!productOrString) return null;

  // String form — used when mapping over an array of image strings
  if (typeof productOrString === 'string') {
    return resolveImageString(productOrString);
  }

  // Object form — prefer images[0], fall back to image
  if (Array.isArray(productOrString.images) && productOrString.images.length > 0) {
    for (const candidate of productOrString.images) {
      const resolved = resolveImageString(candidate);
      if (resolved) return resolved;
    }
  }

  return resolveImageString(productOrString.image);
}

/**
 * Resolve all images for a product into a clean array of usable strings.
 */
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

/**
 * Smooth-scroll to an element by id. Falls back to top if not found.
 */
export function scrollToId(id) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id.replace(/^#/, ''));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}