// ============================================
// MAXVOLT - JavaScript
// ============================================

// Force scroll to top on page load/refresh (but respect #anchors)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('load', () => {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
});

// Configuration
const CONFIG = {
  whatsappNumber: '917595941311',
  businessName: 'MAXVOLT',
  contactEmail: 'maxvolt.power@gmail.com',
  phone: '+91 7595941311'
};

// Compute base path once at module scope so all functions can use it.
// On /products/*.html pages we need "../" to reach /data/, /assets/, etc.
// On root pages (index.html, product-detail.html) we need "".
const basePath = window.location.pathname.includes('/products/') ? '../' : '';

// ============================================
// Product loading — now from the API (MongoDB)
// Falls back to /data/products.json only if the API is unreachable.
// Groups products by `category` field matching the old JSON keys.
// ============================================

let allProducts = {};
let allProductsFlat = []; // flat list for recommendation engine

// Category key mapping: DB `category` -> internal key used in templates
const CATEGORY_KEYS = {
  homeInverterBatteries: 'homeInverterBatteries',
  homeInverters: 'homeInverters',
  inverter: 'homeInverters',
  carBatteries: 'carBatteries',
  totoErickshawBatteries: 'totoErickshawBatteries',
  ebikeBatteries: 'ebikeBatteries',
  ups: 'ups',
  upsOffice: 'ups', // legacy alias
  home_inverter_batteries: 'homeInverterBatteries',
  home_inverters: 'homeInverters',
  car_batteries: 'carBatteries',
  toto_erickshaw_batteries: 'totoErickshawBatteries',
  ebike_batteries: 'ebikeBatteries',
};

function normalizeCategory(cat) {
  if (!cat) return 'homeInverterBatteries';
  return CATEGORY_KEYS[cat] || cat;
}

async function loadProducts() {
  // 1. Try the live API
  try {
    const res = await fetch('/api/products?limit=1000', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const items = (json && json.data && json.data.items) || [];
      if (items.length) {
        hydrateProductStore(items);
        return;
      }
    }
  } catch (err) {
    console.warn('API products unavailable, falling back to JSON:', err.message);
  }

  // 2. Fallback to bundled JSON (only used during local dev / offline)
  try {
    const response = await fetch(basePath + 'data/products.json');
    const data = await response.json();
    const flat = [];
    for (const key in data) {
      if (Array.isArray(data[key])) {
        data[key].forEach(p => flat.push({ ...p, category: normalizeCategory(key) }));
      }
    }
    hydrateProductStore(flat);
  } catch (error) {
    console.error('Error loading products:', error);
    allProducts = {};
    allProductsFlat = [];
  }
}

function hydrateProductStore(items) {
  allProductsFlat = items.slice();
  allProducts = {
    homeInverterBatteries: [],
    homeInverters: [],
    inverter: [],
    carBatteries: [],
    totoErickshawBatteries: [],
    ebikeBatteries: [],
    ups: [],
  };
  items.forEach(p => {
    const key = normalizeCategory(p.category);
    if (!allProducts[key]) allProducts[key] = [];
    allProducts[key].push(p);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupNavigation();
  setupFormHandlers();
  setupProductFilters();
  setupScrollToTop();
  updateCopyrightYear();
});

// ============================================
// NAVIGATION
// ============================================

// Auto-update copyright year
function updateCopyrightYear() {
  const yearEls = document.querySelectorAll('.copyright-year');
  const currentYear = new Date().getFullYear();
  yearEls.forEach(el => {
    el.textContent = currentYear;
  });
}

function setupNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('nav');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('active');
    });

    // Close menu when link is clicked
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
      });
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (nav && !nav.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
      nav.classList.remove('active');
    }
  });

  // Sticky header shadow
  const header = document.getElementById('site-header') || document.querySelector('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

// Update cart badge on all pages
function updateCartBadge() {
  if (!window.maxvoltCart) return;
  const count = window.maxvoltCart.getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', updateCartBadge);
window.addEventListener('cart-updated', updateCartBadge);

// ============================================
// WHATSAPP INTEGRATION
// ============================================

function getWhatsappMessage(product = null) {
  let message = '';
  
  if (product) {
    message = `Hello MAXVOLT, I am interested in ${product.brand} ${product.model}. Please share the current price and availability.`;
  } else {
    message = `Hello MAXVOLT, I need help choosing a battery/inverter/power solution. Please contact me.`;
  }

  return encodeURIComponent(message);
}

function openWhatsapp(message = null) {
  const msg = message || getWhatsappMessage();
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;
  window.open(url, '_blank');
}

// WhatsApp buttons
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-whatsapp]')) {
    const productId = e.target.dataset.whatsapp;
    const product = findProductById(productId);
    openWhatsapp(getWhatsappMessage(product));
  }

  if (e.target.matches('.whatsapp-btn')) {
    openWhatsapp();
  }
});

// ============================================
// FORMS
// ============================================

function setupFormHandlers() {
  const quotationForm = document.getElementById('quotation-form');
  if (quotationForm) {
    quotationForm.addEventListener('submit', handleQuoteSubmit);
  }

  const requirementForm = document.getElementById('requirement-form');
  if (requirementForm) {
    requirementForm.addEventListener('submit', handleRequirementSubmit);
  }
}

function handleQuoteSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('quote-name').value;
  const phone = document.getElementById('quote-phone').value;
  const requirement = document.getElementById('quote-requirement').value;

  if (!name || !phone) {
    alert('Please fill in all required fields');
    return;
  }

  const message = `Hello MAXVOLT, My name is ${name}. I need: ${requirement}. Please contact me at ${phone}.`;
  
  fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name,
      phone: phone,
      email: document.getElementById('quote-email').value || 'not-provided',
      requirement: requirement,
      location: document.getElementById('quote-location').value
    })
  }).then(() => {
    showSuccessMessage('Quote request submitted! We will contact you shortly.');
    e.target.reset();
    
    // Also send WhatsApp
    openWhatsapp(encodeURIComponent(message));
  }).catch(error => {
    console.log('Form submission (local only)');
    showSuccessMessage('Quote request submitted! We will contact you shortly.');
    e.target.reset();
  });
}

function handleRequirementSubmit(e) {
  e.preventDefault();
  const requirement = document.getElementById('requirement-type').value;
  
  // Navigate to appropriate category
  const routes = {
    'home': 'products/home-inverter-batteries.html',
    'car': 'products/car-batteries.html',
    'toto': 'products/toto-erickshaw.html',
    'ebike': 'products/ebike-batteries.html',
    'office': 'products/ups.html',
    'unsure': '#quotation'
  };

  if (routes[requirement]) {
    if (routes[requirement].startsWith('#')) {
      document.querySelector(routes[requirement]).scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = routes[requirement];
    }
  }
}

function showSuccessMessage(message) {
  document.querySelectorAll('.success-message').forEach(el => el.remove());

  const div = document.createElement('div');
  div.className = 'success-message';
  div.setAttribute('role', 'status');
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.transition = 'opacity .3s, transform .3s';
    div.style.opacity = '0';
    div.style.transform = 'translate(-50%, -12px)';
    setTimeout(() => div.remove(), 300);
  }, 3200);
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

function findProductById(id) {
  if (!id) return null;
  // Match either our legacy "id" field OR Mongo's "_id"
  return allProductsFlat.find(p => p.id === id || p._id === id) || null;
}

function displayProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 16px;color:var(--text-muted);">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔋</div>
        <p>No products match your filters. Try adjusting them.</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-image">
        ${renderProductImage(product)}
      </div>
      <div class="product-content">
        <div class="product-brand">${product.brand}</div>
        <h3 class="product-model">${product.model}</h3>

        <div class="product-specs">
          <div class="product-spec">
            <span class="product-spec-label">Capacity</span>
            <span>${product.capacity}</span>
          </div>
          ${product.voltage ? `<div class="product-spec"><span class="product-spec-label">Voltage</span><span>${product.voltage}</span></div>` : ''}
          ${product.warranty ? `<div class="product-spec"><span class="product-spec-label">Warranty</span><span>${product.warranty}</span></div>` : ''}
        </div>

        <div class="product-price">
          ${product.discountedPrice ? `
            <span style="text-decoration:line-through;color:var(--text-subtle);font-size:0.9rem;margin-right:6px;">₹ ${product.price}</span>
            <span style="color:var(--success);font-weight:800;">₹ ${product.discountedPrice}</span>
          ` : `₹ ${product.price}`}
        </div>

        <div class="product-availability ${product.stock === 0 ? 'availability-check' : getAvailabilityClass(product.availability)}">
          ${product.stock === 0 ? 'Out of Stock' : product.availability}
        </div>

        ${product.stock === 0 ? `
          <div style="margin-top:8px;font-size:0.8rem;color:var(--danger);font-weight:600;">Currently unavailable</div>
        ` : ''}

        <div class="product-actions">
          <a href="${basePath}product-detail.html?id=${product.id || product._id}" class="btn btn-primary btn-small">View Details</a>
          ${product.stock === 0
            ? `<button class="btn btn-outline btn-small" disabled style="opacity:0.5;cursor:not-allowed;">Out of Stock</button>`
            : `<button class="btn btn-secondary btn-small" data-whatsapp="${product.id || product._id}" aria-label="Ask about ${product.model} on WhatsApp">WhatsApp</button>`
          }
        </div>
      </div>
    </article>
  `).join('');
}

function getAvailabilityClass(availability) {
  if (availability.includes('Usually')) return 'availability-usually';
  if (availability.includes('Check')) return 'availability-check';
  return 'availability-available';
}

// ============================================
// PRODUCT FILTERS
// ============================================

function setupProductFilters() {
  const brandFilter = document.getElementById('filter-brand');
  const capacityFilter = document.getElementById('filter-capacity');
  const typeFilter = document.getElementById('filter-type');

  [brandFilter, capacityFilter, typeFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', applyFilters);
    }
  });
}

function applyFilters() {
  const category = document.body.dataset.category;
  if (!category || !allProducts[category]) return;

  const brandFilter = document.getElementById('filter-brand')?.value;
  const capacityFilter = document.getElementById('filter-capacity')?.value;
  const typeFilter = document.getElementById('filter-type')?.value;

  let filtered = allProducts[category];

  if (brandFilter && brandFilter !== 'all') {
    filtered = filtered.filter(p => p.brand === brandFilter);
  }

  if (capacityFilter && capacityFilter !== 'all') {
    filtered = filtered.filter(p => p.capacity === capacityFilter);
  }

  if (typeFilter && typeFilter !== 'all') {
    filtered = filtered.filter(p => p.type === typeFilter);
  }

  displayProducts(filtered, 'products-container');
}

/**
 * Resolve the best possible image URL for a product.
 *  - base64 data URL  → use as-is
 *  - http(s) URL      → use as-is
 *  - /assets/... path → use as-is
 *  - bare filename    → assets/images/<filename>
 */
function resolveProductImageSrc(product) {
  if (!product || !product.image) return null;
  const img = String(product.image).trim();
  if (!img) return null;
  if (img.startsWith('data:')) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('/')) return img;
  if (img.startsWith('assets/')) return basePath + img;
  return basePath + 'assets/images/' + img;
}

function renderProductImage(product, opts = {}) {
  const src = resolveProductImageSrc(product);
  if (!src) return '<div style="display:grid;place-items:center;height:100%;font-size:3rem;">🔋</div>';
  const cls = opts.class ? ` class="${opts.class}"` : '';
  return `<img src="${src}" alt="${product.model}" loading="lazy" decoding="async"${cls} style="width:100%;height:100%;object-fit:contain;padding:12px;" onerror="this.style.display='none';this.parentNode.innerHTML='<div style=\\'display:grid;place-items:center;height:100%;font-size:3rem;\\'>🔋</div>';">`;
}

// ============================================
// PRODUCT DETAIL PAGE
// ============================================

function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) return;

  const product = findProductById(productId);
  if (!product) return;

  const detail = document.getElementById('product-detail');
  if (detail) {
    const images = (product.images && product.images.length)
      ? product.images
      : (product.image ? [product.image] : []);

    detail.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1200px; margin: 0 auto;">
        <div>
          <div class="product-image" id="pd-main-image" style="height: 400px; border-radius: 8px; margin-bottom: 20px; cursor: ${images.length > 1 ? 'pointer' : 'default'};">
            ${images.length ? `<img src="${resolveProductImageSrc({ image: images[0] })}" alt="${product.model}" style="width: 100%; height: 100%; object-fit: contain; padding: 24px;">` : '🔋'}
          </div>
          ${images.length > 1 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px;">
              ${images.map((img, i) => `
                <button type="button" class="pd-thumb" data-img-index="${i}" style="background: var(--bg-muted); border: 2px solid ${i === 0 ? 'var(--secondary)' : 'var(--border)'}; border-radius: 8px; padding: 4px; cursor: pointer; aspect-ratio: 1;">
                  <img src="${resolveProductImageSrc({ image: img })}" style="width:100%;height:100%;object-fit:contain;" alt="">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div>
          <div class="product-brand">${product.brand}</div>
          <h1 style="margin: 8px 0 16px;">${product.model}</h1>

          <div class="surface" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">Key Specifications</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Capacity:</strong> ${product.capacity}</div>
              ${product.voltage ? `<div><strong>Voltage:</strong> ${product.voltage}</div>` : ''}
              ${product.type ? `<div><strong>Type:</strong> ${product.type}</div>` : ''}
              ${product.warranty ? `<div><strong>Warranty:</strong> ${product.warranty}</div>` : ''}
              ${product.bestFor ? `<div><strong>Best For:</strong> ${product.bestFor}</div>` : ''}
              ${product.suitableLoad ? `<div><strong>Suitable Load:</strong> ${product.suitableLoad}</div>` : ''}
            </div>
          </div>

          <div style="background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.3); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="font-size: 0.85rem; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Price</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--secondary-light);">₹ ${product.price}</div>
            <div style="font-size: 0.8rem; color: var(--text-subtle); margin-top: 6px;">Inclusive of GST. Final price confirmed at checkout.</div>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <button class="btn btn-primary btn-full" id="buy-now-btn">🛒 Buy Now</button>
            <button class="btn btn-outline btn-full" id="add-to-cart-btn">Add to Cart</button>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <button class="btn btn-secondary btn-full" data-whatsapp="${product.id}">💬 Ask on WhatsApp</button>
            <a href="${basePath}index.html#quotation" class="btn btn-outline btn-full">📋 Get Quote</a>
          </div>

          <div class="surface">
            <h4 style="margin-bottom: 12px;">Not Sure?</h4>
            <p style="margin-bottom: 12px;">Talk to our MAXVOLT experts. We'll recommend the right product based on your actual requirement.</p>
            <a href="${basePath}index.html#quotation" class="btn btn-secondary" style="display: inline-block;">Get Expert Help</a>
          </div>
        </div>
      </div>
    `;

    // Thumbnail gallery wiring
    const thumbs = detail.querySelectorAll('.pd-thumb');
    if (thumbs.length) {
      thumbs.forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.imgIndex);
          const mainImg = detail.querySelector('#pd-main-image img');
          if (mainImg) mainImg.src = resolveProductImageSrc({ image: images[idx] });
          thumbs.forEach(b => b.style.borderColor = 'var(--border)');
          btn.style.borderColor = 'var(--secondary)';
        });
      });
    }

    // Buy Now → add to cart + go to checkout
    document.getElementById('buy-now-btn').addEventListener('click', () => {
      window.maxvoltCart.clearCart();
      window.maxvoltCart.addToCart(product, 1);
      window.location.href = basePath + 'checkout.html';
    });

    // Add to Cart
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
      window.maxvoltCart.addToCart(product, 1);
    });
  }
}

function getAvailabilityBg(availability) {
  if (availability.includes('Usually')) return '#fff3e0';
  if (availability.includes('Check')) return '#fce4ec';
  return '#e8f5e9';
}

// ============================================
// REAL RECOMMENDATION ENGINE
// Uses actual products from MongoDB, scores them against
// the user's load requirement, and returns the best match.
// ============================================

/**
 * Estimate total load in watts from the calculator form.
 */
// Appliance definitions with realistic wattages
const APPLIANCES = [
  { id: 'fan',        name: 'Ceiling Fan',           icon: '🌀', watts: 70,  default: 2 },
  { id: 'light',      name: 'LED Light',             icon: '💡', watts: 12,  default: 5 },
  { id: 'tube',       name: 'Tube Light',            icon: '🔆', watts: 40,  default: 0 },
  { id: 'tv',         name: 'Television',            icon: '📺', watts: 110, default: 0 },
  { id: 'fridge',     name: 'Refrigerator',          icon: '🧊', watts: 180, default: 0 },
  { id: 'router',     name: 'Wi-Fi Router',          icon: '📶', watts: 15,  default: 0 },
  { id: 'computer',   name: 'Desktop Computer',      icon: '💻', watts: 200, default: 0 },
  { id: 'laptop',     name: 'Laptop',                icon: '💻', watts: 60,  default: 0 },
  { id: 'ac',         name: 'Air Conditioner (1.5T)',icon: '❄️', watts: 1500,default: 0 },
  { id: 'microwave',  name: 'Microwave',             icon: '📡', watts: 1200,default: 0 },
  { id: 'mixer',      name: 'Mixer/Grinder',         icon: '🥤', watts: 500, default: 0 },
  { id: 'iron',       name: 'Iron',                  icon: '👔', watts: 1000,default: 0 },
  { id: 'waterpump',  name: 'Water Pump',            icon: '🚰', watts: 750, default: 0 },
  { id: 'cctv',       name: 'CCTV Camera',           icon: '📹', watts: 10,  default: 0 },
  { id: 'printer',    name: 'Printer',               icon: '🖨️', watts: 300, default: 0 },
];

function renderApplianceList() {
  const container = document.getElementById('calc-appliance-list');
  if (!container) return;
  container.innerHTML = APPLIANCES.map(a => `
    <div class="calc-appliance-row" data-id="${a.id}">
      <div class="appliance-icon">${a.icon}</div>
      <div>
        <div class="appliance-name">${a.name}</div>
        <div class="appliance-watts">~${a.watts}W each</div>
      </div>
      <input type="number" min="0" max="20" value="${a.default}" data-qty="${a.id}" ${a.default === 0 ? 'disabled' : ''}>
      <div class="appliance-toggle">
        <input type="checkbox" data-toggle="${a.id}" ${a.default > 0 ? 'checked' : ''}>
      </div>
    </div>
  `).join('');

  container.addEventListener('change', (e) => {
    const toggleId = e.target.dataset.toggle;
    if (toggleId) {
      const qtyInput = container.querySelector(`[data-qty="${toggleId}"]`);
      if (qtyInput) {
        qtyInput.disabled = !e.target.checked;
        if (e.target.checked && Number(qtyInput.value) === 0) qtyInput.value = 1;
      }
    }
  });
}

function estimateLoad(form) {
  const rows = form.querySelectorAll('.calc-appliance-row');
  let total = 0;
  const breakdown = [];
  const counts = {};

  rows.forEach(row => {
    const id = row.dataset.id;
    const appliance = APPLIANCES.find(a => a.id === id);
    if (!appliance) return;
    const toggle = row.querySelector(`[data-toggle="${id}"]`);
    if (!toggle || !toggle.checked) return;
    const qty = parseInt(row.querySelector(`[data-qty="${id}"]`)?.value) || 0;
    if (qty <= 0) return;
    const watts = qty * appliance.watts;
    total += watts;
    counts[id] = qty;
    breakdown.push({ name: appliance.name, qty, watts });
  });

  return { total, breakdown, counts };
}

function requiredInverterVA(loadWatts) {
  const raw = loadWatts * 1.6;
  const sizes = [600, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800, 2000, 2500, 3000, 4000, 5000];
  return sizes.find(s => s >= raw) || 5000;
}

function requiredBatteryAh(loadWatts, hours) {
  const raw = (loadWatts * hours) / (12 * 0.85 * 0.6);
  const sizes = [100, 120, 135, 150, 160, 180, 200, 220, 250, 300];
  return sizes.find(s => s >= raw) || 300;
}

// (moved above into the new calculator block)

/**
 * Score a product against a target capacity / VA / Ah.
 * Lower score = better match.
 */
function scoreProduct(product, targets) {
  const cat = normalizeCategory(product.category);

  // Inverters — match on VA
  if (cat === 'homeInverters') {
    const va = parseInt(String(product.va || '').replace(/\D/g, '')) || 0;
    if (!va) return 9999;
    const diff = Math.abs(va - targets.va);
    // Prefer the smallest VA that still meets requirement
    const penalty = va < targets.va ? 500 : 0;
    return diff + penalty;
  }

  // Home inverter batteries — match on Ah
  if (cat === 'homeInverterBatteries') {
    const ah = parseInt(String(product.capacity || '').replace(/\D/g, '')) || 0;
    if (!ah) return 9999;
    const diff = Math.abs(ah - targets.ah);
    const penalty = ah < targets.ah ? 500 : 0;
    return diff + penalty;
  }

  return 9999;
}

/**
 * Recommend the best inverter + battery from REAL products in the DB.
 */
function recommendProducts(loadWatts, hours = 3) {
  const targets = {
    va: requiredInverterVA(loadWatts),
    ah: requiredBatteryAh(loadWatts, hours),
  };

  const inverters = (allProducts.homeInverters || [])
    .filter(p => p.active !== false && (p.stock === undefined || p.stock > 0))
    .map(p => ({ p, score: scoreProduct(p, targets) }))
    .sort((a, b) => a.score - b.score);

  const batteries = (allProducts.homeInverterBatteries || [])
    .filter(p => p.active !== false && (p.stock === undefined || p.stock > 0))
    .map(p => ({ p, score: scoreProduct(p, targets) }))
    .sort((a, b) => a.score - b.score);

  const validInverter = inverters.find(i => {
    const va = parseInt(String(i.p.va || '').replace(/\D/g, '')) || 0;
    return va >= loadWatts * 0.8;
  });
  const validBattery = batteries.find(b => {
    const ah = parseInt(String(b.p.capacity || '').replace(/\D/g, '')) || 0;
    return ah >= targets.ah * 0.8;
  });

  // Check for a matching combo section
  let combo = null;
  const comboSections = window._comboSections || {};
  for (const [sid, products] of Object.entries(comboSections)) {
    const inv = products.find(p => normalizeCategory(p.category) === 'homeInverters');
    const bat = products.find(p => normalizeCategory(p.category) === 'homeInverterBatteries');
    if (inv && bat) {
      const va = parseInt(String(inv.va || '').replace(/\D/g, '')) || 0;
      const ah = parseInt(String(bat.capacity || '').replace(/\D/g, '')) || 0;
      if (va >= loadWatts * 0.8 && ah >= targets.ah * 0.8) {
        combo = { id: sid, products, inverter: inv, battery: bat };
        break;
      }
    }
  }

  return {
    inverter: validInverter?.p || inverters[0]?.p || null,
    battery: validBattery?.p || batteries[0]?.p || null,
    combo,
    targets,
    valid: !!(validInverter && validBattery),
  };
}

function setupCalculator() {
  const form = document.getElementById('requirement-calculator');
  if (!form) return;

  renderApplianceList();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const { total, counts, breakdown } = estimateLoad(form);
    const hours = parseFloat(document.getElementById('calc-backup-hours')?.value) || 3;
    const rec = recommendProducts(total, hours);

    const result = document.getElementById('calculator-result');
    if (!result) return;

    if (total === 0) {
      result.innerHTML = `
        <div style="background: rgba(245,158,11,0.1); padding: 24px; border-radius: 12px; border-left: 4px solid var(--warning); color: var(--text);">
          <h3 style="color: var(--warning); margin-bottom: 12px;">No Appliances Selected</h3>
          <p>Please select at least one appliance to get a recommendation.</p>
        </div>
      `;
      return;
    }

    if (!rec.valid) {
      result.innerHTML = `
        <div style="background: rgba(239,68,68,0.1); padding: 24px; border-radius: 12px; border-left: 4px solid var(--danger); color: var(--text);">
          <h3 style="color: var(--danger); margin-bottom: 12px;">Requirement Exceeds Available Solutions</h3>
          <p>Your estimated load of <strong>${total}W</strong> requires ~<strong>${rec.targets.va}VA</strong> inverter and ~<strong>${rec.targets.ah}Ah</strong> battery, which is beyond our current stock.</p>
          <p style="margin-top:12px;">Please contact us directly for a custom solution.</p>
          <a href="${basePath}index.html#quotation" class="btn btn-primary" style="margin-top:16px;">Get Custom Quote</a>
          <button class="btn btn-secondary" style="margin-left:8px;" onclick="openWhatsapp('${encodeURIComponent('Hi MAXVOLT, I need a custom power solution for ' + total + 'W load. Please help.')}')">Contact on WhatsApp</button>
        </div>
      `;
      return;
    }

    const itemsHtml = breakdown.map(b => `${b.name} ×${b.qty}`).join(' · ');

    // Combo recommendation
    if (rec.combo) {
      result.innerHTML = `
        <div style="background: rgba(255,107,0,0.1); padding: 24px; border-radius: 12px; border-left: 4px solid var(--secondary); color: var(--text);">
          <h3 style="color: var(--secondary); margin-bottom: 16px;">🎁 Recommended Combo Package</h3>
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border);">
            <div style="margin-bottom: 10px;"><strong>Your items:</strong> ${itemsHtml}</div>
            <div style="margin-bottom: 6px;"><strong>Estimated Load:</strong> ${total}W</div>
            <div style="margin-bottom: 12px;"><strong>Backup Time:</strong> ${hours} hour(s)</div>
            <div style="margin-bottom: 12px;"><strong>Inverter:</strong> ${rec.combo.inverter.brand} ${rec.combo.inverter.model}</div>
            <div><strong>Battery:</strong> ${rec.combo.battery.brand} ${rec.combo.battery.model}</div>
          </div>
          <p style="color: var(--text-muted); margin-bottom: 16px;">This combo package is optimized for your requirement.</p>
          <button class="btn btn-secondary" onclick="addComboToCart('${rec.combo.id}')">🛒 Add Combo to Cart</button>
          <a href="${basePath}index.html#quotation" class="btn btn-primary" style="margin-left:8px;">Get Quote</a>
        </div>
      `;
      return;
    }

    const inverterLine = rec.inverter
      ? `<strong>Recommended Inverter:</strong>
           <a href="${basePath}product-detail.html?id=${rec.inverter.id || rec.inverter._id}">
             ${rec.inverter.brand} ${rec.inverter.model}
           </a>
           <span style="color:var(--text-subtle);">(${rec.inverter.va})</span>`
      : `<strong>Recommended Inverter:</strong> ~${rec.targets.va}VA
           <span style="color:var(--text-subtle);">(contact us)</span>`;

    const batteryLine = rec.battery
      ? `<strong>Recommended Battery:</strong>
           <a href="${basePath}product-detail.html?id=${rec.battery.id || rec.battery._id}">
             ${rec.battery.brand} ${rec.battery.model}
           </a>
           <span style="color:var(--text-subtle);">(${rec.battery.capacity})</span>`
      : `<strong>Recommended Battery:</strong> ~${rec.targets.ah}Ah
           <span style="color:var(--text-subtle);">(contact us)</span>`;

    const waMessage = encodeURIComponent(
      `Hi MAXVOLT, based on my requirement (${itemsHtml}), ` +
      `my estimated load is ${total}W with ${hours}h backup. Please quote for: ` +
      `${rec.inverter ? rec.inverter.brand + ' ' + rec.inverter.model : rec.targets.va + 'VA inverter'} + ` +
      `${rec.battery ? rec.battery.brand + ' ' + rec.battery.model : rec.targets.ah + 'Ah battery'}.`
    );

    result.innerHTML = `
      <div style="background: rgba(16,185,129,0.1); padding: 24px; border-radius: 12px; border-left: 4px solid var(--success); color: var(--text);">
        <h3 style="color: var(--success); margin-bottom: 16px;">✓ Best Match Found</h3>
        <div style="background: var(--bg-elevated); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border);">
          <div style="margin-bottom: 10px;"><strong>Your items:</strong> ${itemsHtml}</div>
          <div style="margin-bottom: 6px;"><strong>Estimated Load:</strong> ${total}W</div>
          <div style="margin-bottom: 12px;"><strong>Backup Time:</strong> ${hours} hour(s)</div>
          <div style="margin-bottom: 12px;">${inverterLine}</div>
          <div>${batteryLine}</div>
        </div>
        <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.95rem;">
          This is an estimate based on typical usage. For precise sizing and pricing, contact our experts.
        </p>
        <a href="${basePath}index.html#quotation" class="btn btn-primary">Get Personalized Quote</a>
        <button class="btn btn-secondary" style="margin-left:8px;"
          onclick="openWhatsapp('${waMessage}')">
          <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Send via WhatsApp
        </button>
      </div>
    `;
  });
}

// ============================================
// ANIMATIONS
// ============================================

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// SCROLL TO TOP
// ============================================

function setupScrollToTop() {
  const scrollTop = document.getElementById('scroll-top');
  if (!scrollTop) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTop.style.display = 'flex';
    } else {
      scrollTop.style.display = 'none';
    }
  });

  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Load product detail page if needed
if (document.querySelector('#product-detail')) {
  loadProductDetail();
}

// Setup calculator if present
if (document.querySelector('#requirement-calculator')) {
  setupCalculator();
}

window.openWhatsapp = openWhatsapp;
window.normalizeCategory = normalizeCategory;
window.addComboToCart = function(sectionId) {
  const products = window._comboSections?.[sectionId];
  if (!products) return;
  products.forEach(p => window.maxvoltCart.addToCart(p, 1));
  showSuccessMessage(`${products.length} items added to cart`);
};

// Load dynamic sections
async function loadDynamicSections() {
  const container = document.getElementById('dynamic-sections');
  if (!container) return;
  try {
    const res = await fetch('/api/sections');
    const json = await res.json();
    const sections = json.data || [];
    if (!sections.length) return;

    const hasFeatured = sections.some(s => s.type === 'featured');
    if (hasFeatured) {
      const fallback = document.getElementById('featured-fallback');
      if (fallback) fallback.style.display = 'none';
    }

    for (const section of sections) {
      const products = (section.products || [])
        .map(pid => allProductsFlat.find(p => p._id === pid || p.id === pid))
        .filter(Boolean);

      if (!products.length) continue;

      const sectionEl = document.createElement('section');
      sectionEl.className = 'dynamic-section';
      const isCombo = section.type === 'combo';
      const isSale = section.type === 'sale';
      sectionEl.innerHTML = `
        <div class="container">
          <div class="section-header">
            <h2>${section.title}</h2>
            <p>${isSale ? 'Limited time offers' : isCombo ? 'Bundle & save' : 'Hand-picked for you'}</p>
          </div>
          ${isCombo ? `
            <div style="text-align:center;margin-bottom:16px;">
              <span style="display:inline-block;padding:6px 16px;background:linear-gradient(135deg,var(--secondary),var(--secondary-light));color:#fff;border-radius:999px;font-weight:700;font-size:0.85rem;">🎁 COMBO OFFER</span>
            </div>
          ` : ''}
          <div class="product-grid" id="section-${section._id}"></div>
          ${isCombo ? `
            <div style="text-align:center;margin-top:24px;">
              <button class="btn btn-secondary" onclick="addComboToCart('${section._id}')">🛒 Add Combo to Cart</button>
            </div>
          ` : ''}
        </div>
      `;
      container.appendChild(sectionEl);
      displayProducts(products, `section-${section._id}`);

      window._comboSections = window._comboSections || {};
      window._comboSections[section._id] = products;
    }
  } catch (e) {
    console.warn('Dynamic sections unavailable:', e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Wait for products to be in memory, then load sections
  const t = setInterval(() => {
    if (allProductsFlat.length > 0) {
      clearInterval(t);
      loadDynamicSections();
    }
  }, 200);
  // Fallback in case products never load
  setTimeout(() => {
    clearInterval(t);
    if (!document.querySelector('.dynamic-section')) loadDynamicSections();
  }, 4000);
});

// ============================================
// HERO CAROUSEL — self-initializing, animated
// ============================================

(function initHeroCarousel() {
  const AUTO_MS = 6000;

  function run() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel || carousel.dataset.ready === '1') return;

    const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
    const dots = Array.from(carousel.querySelectorAll('.hero-dot'));
    const prevBtn = carousel.querySelector('.hero-prev');
    const nextBtn = carousel.querySelector('.hero-next');

    if (slides.length < 2) return;

    carousel.dataset.ready = '1';
    carousel.setAttribute('tabindex', '0');

    // Respect reduced motion — but STILL rotate (just without slide transitions)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let index = slides.findIndex(s => s.classList.contains('is-active'));
    if (index < 0) index = 0;
    let timer = null;

    function restartContentAnimations(slide) {
      // Re-trigger CSS entrance animations on the active slide
      const animated = slide.querySelectorAll('.tagline, h1, p, .hero-cta, .hero-eyebrow, .hero-feature-pill, .hero-stat-card, .hero-badge-large');
      animated.forEach(el => {
        el.style.animation = 'none';
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        el.style.animation = '';
      });
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach((s, i) => {
        const active = i === index;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });

      // Reset the progress bar on the carousel
      const bar = carousel.querySelector('.hero-progress-bar');
      if (bar) {
        bar.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        bar.offsetHeight;
        bar.style.animation = '';
      }

      restartContentAnimations(slides[index]);
    }

    function advance() { show(index + 1); }
    function goBack() { show(index - 1); }

    function start() {
      stop();
      if (reduceMotion) return;
      timer = setInterval(() => {
        if (!document.hidden) advance();
      }, AUTO_MS);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function restart() { stop(); start(); }

    // Buttons
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); advance(); restart(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); goBack(); restart(); });

    // Dots
    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        show(i);
        restart();
      });
    });

    // No pause on hover / focus — carousel always advances.
    // (Visibility pause below is kept to save CPU when the tab is hidden.)

    // Pause only when the browser tab itself is hidden (saves CPU)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    // Keyboard
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { advance(); restart(); }
      if (e.key === 'ArrowLeft') { goBack(); restart(); }
    });

    // Touch swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      touchMoved = false;
    }, { passive: true });
    carousel.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      if (!touchMoved) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) advance(); else goBack();
        restart();
      }
    }, { passive: true });

    // Kick off
    show(index);
    start();
  }

  // Run now if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // Safety net: also try a moment later (in case something re-rendered the DOM)
  window.addEventListener('load', run, { once: true });
})();