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

        <div class="product-price">₹ ${product.price}</div>

        <div class="product-availability ${getAvailabilityClass(product.availability)}">
          ${product.availability}
        </div>

        <div class="product-actions">
          <a href="${basePath}product-detail.html?id=${product.id}" class="btn btn-primary btn-small">View Details</a>
          <button class="btn btn-secondary btn-small" data-whatsapp="${product.id}" aria-label="Ask about ${product.model} on WhatsApp">WhatsApp</button>
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
  if (!src) return '🔋';
  const cls = opts.class ? ` class="${opts.class}"` : '';
  return `<img src="${src}" alt="${product.model}" loading="lazy" decoding="async"${cls} onerror="this.style.display='none';this.parentNode.textContent='🔋';">`;
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
    detail.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1200px; margin: 0 auto;">
        <div>
          <div class="product-image" style="height: 400px; border-radius: 8px; margin-bottom: 20px;">
            ${product.image ? `<img src="${resolveProductImageSrc(product)}" alt="${product.model}" style="width: 100%; height: 100%; object-fit: contain; padding: 24px;">` : '🔋'}
          </div>
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
function estimateLoad(form) {
  const fans      = parseInt(form.querySelector('#calc-fans')?.value) || 0;
  const lights    = parseInt(form.querySelector('#calc-lights')?.value) || 0;
  const tv        = form.querySelector('#calc-tv')?.checked ? 1 : 0;
  const fridge    = form.querySelector('#calc-fridge')?.checked ? 1 : 0;
  const router    = form.querySelector('#calc-router')?.checked ? 1 : 0;
  const computer  = form.querySelector('#calc-computer')?.checked ? 1 : 0;

  // Realistic average wattages
  const WATTS = {
    fan: 70, light: 12, tv: 110, fridge: 180, router: 15, computer: 180,
  };

  const total =
    fans * WATTS.fan +
    lights * WATTS.light +
    tv * WATTS.tv +
    fridge * WATTS.fridge +
    router * WATTS.router +
    computer * WATTS.computer;

  return {
    total,
    breakdown: { fans, lights, tv, fridge, router, computer },
    counts: { fans, lights, tv, fridge, router, computer },
  };
}

/**
 * Required inverter VA. Rule of thumb: load * 1.25 (safety) / 0.8 (power factor)
 * → roughly load * 1.6. Then round up to a standard size.
 */
function requiredInverterVA(loadWatts) {
  const raw = loadWatts * 1.6;
  const sizes = [600, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800, 2000, 2500, 3000];
  return sizes.find(s => s >= raw) || 3000;
}

/**
 * Required battery Ah.
 * Backup hours assumed: 3 hrs at full load (typical Indian home).
 * Ah = (Load * Hours) / (BatteryVoltage * Efficiency * DoD)
 *   = (Load * 3) / (12 * 0.85 * 0.6) ≈ Load * 0.49
 * Then round up to a standard capacity.
 */
function requiredBatteryAh(loadWatts) {
  const raw = (loadWatts * 3) / (12 * 0.85 * 0.6);
  const sizes = [100, 120, 135, 150, 160, 180, 200, 220, 250];
  return sizes.find(s => s >= raw) || 250;
}

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
function recommendProducts(loadWatts) {
  const targets = {
    va: requiredInverterVA(loadWatts),
    ah: requiredBatteryAh(loadWatts),
  };

  const inverters = (allProducts.homeInverters || [])
    .filter(p => p.active !== false)
    .map(p => ({ p, score: scoreProduct(p, targets) }))
    .sort((a, b) => a.score - b.score);

  const batteries = (allProducts.homeInverterBatteries || [])
    .filter(p => p.active !== false)
    .map(p => ({ p, score: scoreProduct(p, targets) }))
    .sort((a, b) => a.score - b.score);

  return {
    inverter:  inverters[0]?.p || null,
    battery:   batteries[0]?.p || null,
    targets,
  };
}

function setupCalculator() {
  const form = document.getElementById('requirement-calculator');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const { total, counts, breakdown } = estimateLoad(form);
    const rec = recommendProducts(total);

    const result = document.getElementById('calculator-result');
    if (!result) return;

    const inverterLine = rec.inverter
      ? `<strong>Recommended Inverter:</strong>
           <a href="${basePath}product-detail.html?id=${rec.inverter.id || rec.inverter._id}">
             ${rec.inverter.brand} ${rec.inverter.model}
           </a>
           <span style="color:var(--text-subtle);">(${rec.inverter.va})</span>`
      : `<strong>Recommended Inverter:</strong> ~${rec.targets.va}VA Pure Sine Wave
           <span style="color:var(--text-subtle);">(no exact match in stock — contact us)</span>`;

    const batteryLine = rec.battery
      ? `<strong>Recommended Battery:</strong>
           <a href="${basePath}product-detail.html?id=${rec.battery.id || rec.battery._id}">
             ${rec.battery.brand} ${rec.battery.model}
           </a>
           <span style="color:var(--text-subtle);">(${rec.battery.capacity})</span>`
      : `<strong>Recommended Battery:</strong> ~${rec.targets.ah}Ah Tubular
           <span style="color:var(--text-subtle);">(no exact match in stock — contact us)</span>`;

    const itemsHtml = [
      counts.fans     ? `${counts.fans} fan(s)`         : '',
      counts.lights   ? `${counts.lights} light(s)`     : '',
      counts.tv       ? 'TV'                            : '',
      counts.fridge   ? 'Refrigerator'                  : '',
      counts.router   ? 'Wi-Fi Router'                  : '',
      counts.computer ? 'Computer'                      : '',
    ].filter(Boolean).join(' · ') || 'No items selected';

    const waMessage = encodeURIComponent(
      `Hi MAXVOLT, based on my requirement (${itemsHtml}), ` +
      `my estimated load is ${total}W. Please quote for: ` +
      `${rec.inverter ? rec.inverter.brand + ' ' + rec.inverter.model : rec.targets.va + 'VA inverter'} + ` +
      `${rec.battery ? rec.battery.brand + ' ' + rec.battery.model : rec.targets.ah + 'Ah battery'}.`
    );

    result.innerHTML = `
      <div style="background: rgba(16,185,129,0.1); padding: 24px; border-radius: 12px; border-left: 4px solid var(--success); color: var(--text);">
        <h3 style="color: var(--success); margin-bottom: 16px;">Based on Your Requirement</h3>
        <div style="background: var(--bg-elevated); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border);">
          <div style="margin-bottom: 10px;"><strong>Your items:</strong> ${itemsHtml}</div>
          <div style="margin-bottom: 12px;"><strong>Estimated Load:</strong> ${total}W</div>
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