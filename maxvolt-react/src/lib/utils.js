export const CONFIG = {
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '917595941311',
  businessName: 'MAXVOLT',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'maxvolt.power@gmail.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '+91 7595941311',
};

export function formatPrice(price) {
  if (!price && price !== 0) return 'Price on request';
  const num = typeof price === 'string' ? parseInt(price.replace(/\D/g, ''), 10) : price;
  if (isNaN(num)) return price;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function openWhatsapp(message = null) {
  const defaultMsg = 'Hello MAXVOLT, I need help choosing a battery/inverter/power solution. Please contact me.';
  const msg = message || defaultMsg;
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

export function getWhatsappMessage(product = null) {
  if (product) {
    return `Hello MAXVOLT, I am interested in ${product.brand} ${product.model}. Please share the current price and availability.`;
  }
  return 'Hello MAXVOLT, I need help choosing a battery/inverter/power solution. Please contact me.';
}

export function resolveProductImage(product) {
  if (!product || !product.image) return null;
  const img = String(product.image).trim();
  if (!img) return null;
  if (img.startsWith('data:')) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('/')) return img;
  if (img.startsWith('assets/')) return `/${img}`;
  return `/assets/images/${img}`;
}

export function getAvailabilityClass(availability) {
  if (!availability) return 'availability-available';
  if (availability.includes('Usually')) return 'availability-usually';
  if (availability.includes('Check')) return 'availability-check';
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

export function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  const str = String(priceStr).replace(/[₹,\s]/g, '').trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}