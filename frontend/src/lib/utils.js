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
 * Parse a price value into { min, max, isRange, raw }.
 * Handles:
 *   9500                     -> { min: 9500, max: 9500, isRange: false }
 *   "9500"                   -> { min: 9500, max: 9500, isRange: false }
 *   "9500 - 10500"           -> { min: 9500, max: 10500, isRange: true }
 *   "₹9,500 – ₹10,500"       -> { min: 9500, max: 10500, isRange: true }
 *   "Price on request"       -> { min: 0, max: 0, isRange: false, invalid: true }
 */
export function parsePrice(value) {
  if (value === null || value === undefined || value === '') {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return { min: value, max: value, isRange: false, raw: value };
  }

  const str = String(value).trim();
  if (!str) return { min: 0, max: 0, isRange: false, invalid: true, raw: value };

  // Extract all numbers (allow commas, currency symbols)
  const nums = str
    .replace(/[₹,\s]/g, '')
    .match(/\d+(?:\.\d+)?/g);

  if (!nums || nums.length === 0) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }

  const parsed = nums.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  const min = Math.min(...parsed);
  const max = Math.max(...parsed);

  return {
    min,
    max,
    isRange: max !== min,
    invalid: false,
    raw: value,
  };
}

/**
 * Numeric price used for sorting / cart math.
 * For a range, we use the LOWER bound (min) so sorting is predictable.
 */
export function parsePriceToNumber(value) {
  return parsePrice(value).min || 0;
}

/**
 * Format a single number as INR.
 */
export function formatINR(num) {
  if (!Number.isFinite(num)) return 'Price on request';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Format a price value for display.
 * Ranges render as "₹9,500 – ₹10,500".
 */
export function formatPrice(value) {
  const { min, max, isRange, invalid } = parsePrice(value);
  if (invalid) return 'Price on request';
  if (isRange) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min);
}

/**
 * Format a date as "12 Jan 2026".
 */
export function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatDateTime(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Open WhatsApp with a prefilled message.
 */
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

/**
 * Resolve a product image reference into a usable <img src>.
 * Returns null if no usable image — components should render a placeholder.
 */
export function resolveProductImage(product) {
  if (!product) return null;
  const raw =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    null;

  if (!raw) return null;
  const img = String(raw).trim();
  if (!img) return null;

  if (img.startsWith('data:')) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('/')) return img;
  if (img.startsWith('assets/')) return `/${img}`;
  return `/assets/images/${img}`;
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

/**
 * Generate initials for avatar fallback.
 */
export function initialsFrom(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const s = String(nameOrEmail).trim();
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}