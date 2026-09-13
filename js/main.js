// ============================================
// MAXVOLT - JavaScript
// ============================================

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

// Load products from JSON
let allProducts = {};

async function loadProducts() {
  try {
    const response = await fetch(basePath + 'data/products.json');
    allProducts = await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupNavigation();
  setupFormHandlers();
  setupProductFilters();
  setupScrollToTop();
});

// ============================================
// NAVIGATION
// ============================================

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
}

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
  const div = document.createElement('div');
  div.className = 'success-message';
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #27ae60;
    color: white;
    padding: 16px 24px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    animation: slideDown 0.3s ease;
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

function findProductById(id) {
  for (const category in allProducts) {
    const product = allProducts[category].find(p => p.id === id);
    if (product) return product;
  }
  return null;
}

function displayProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-image">
        ${product.image ? `<img src="${basePath}assets/images/${product.image}" alt="${product.model}" loading="lazy">` : '🔋'}
      </div>
      <div class="product-content">
        <div class="product-brand">${product.brand}</div>
        <div class="product-model">${product.model}</div>
        
        <div class="product-specs">
          <div class="product-spec">
            <span class="product-spec-label">Capacity:</span>
            <span>${product.capacity}</span>
          </div>
          ${product.voltage ? `
            <div class="product-spec">
              <span class="product-spec-label">Voltage:</span>
              <span>${product.voltage}</span>
            </div>
          ` : ''}
          ${product.warranty ? `
            <div class="product-spec">
              <span class="product-spec-label">Warranty:</span>
              <span>${product.warranty}</span>
            </div>
          ` : ''}
        </div>

        <div class="product-price">${product.price}</div>
        
        <div class="product-availability ${getAvailabilityClass(product.availability)}">
          ${product.availability}
        </div>

        <div class="product-actions">
          <a href="${basePath}product-detail.html?id=${product.id}" class="btn btn-primary btn-small">View Details</a>
          <button class="btn btn-secondary btn-small" data-whatsapp="${product.id}">WhatsApp</button>
        </div>
      </div>
    </div>
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
            ${product.image ? `<img src="${basePath}assets/images/${product.image}" alt="${product.model}" style="width: 100%; height: 100%; object-fit: cover;">` : '🔋'}
          </div>
        </div>
        <div>
          <div class="product-brand">${product.brand}</div>
          <h1 style="margin: 8px 0 16px; color: #003366;">${product.model}</h1>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
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

          <div style="background: #fff3e0; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin-bottom: 8px; color: #f57c00;">Price</h3>
            <div style="font-size: 1.5rem; font-weight: 700; color: #ff6b00;">₹ ${product.price}</div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">For current pricing, please get a quote.</div>
          </div>

          <div style="background: ${getAvailabilityBg(product.availability)}; padding: 12px; border-radius: 6px; margin-bottom: 24px; font-weight: 600;">
            ${product.availability}
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <button class="btn btn-primary btn-full" data-whatsapp="${product.id}">💬 Ask on WhatsApp</button>
            <a href="${basePath}index.html#quotation" class="btn btn-outline btn-full">📋 Get Quote</a>
          </div>

          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
            <h4 style="margin-bottom: 12px;">Not Sure?</h4>
            <p style="margin-bottom: 12px;">Talk to our MAXVOLT experts. We'll recommend the right product based on your actual requirement.</p>
            <a href="${basePath}index.html#quotation" class="btn btn-secondary" style="display: inline-block;">Get Expert Help</a>
          </div>
        </div>
      </div>
    `;
  }
}

function getAvailabilityBg(availability) {
  if (availability.includes('Usually')) return '#fff3e0';
  if (availability.includes('Check')) return '#fce4ec';
  return '#e8f5e9';
}

// ============================================
// CALCULATOR
// ============================================

function setupCalculator() {
  const form = document.getElementById('requirement-calculator');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fans = parseInt(document.getElementById('calc-fans').value) || 0;
    const lights = parseInt(document.getElementById('calc-lights').value) || 0;
    const tv = document.getElementById('calc-tv').checked ? 1 : 0;
    const fridge = document.getElementById('calc-fridge').checked ? 1 : 0;
    const router = document.getElementById('calc-router').checked ? 1 : 0;
    const computer = document.getElementById('calc-computer').checked ? 1 : 0;

    // Simple calculation (in watts)
    let totalLoad = 0;
    totalLoad += fans * 60;
    totalLoad += lights * 10;
    totalLoad += tv * 100;
    totalLoad += fridge * 150;
    totalLoad += router * 10;
    totalLoad += computer * 150;

    // Recommend inverter and battery
    let inverterVA = 700;
    let batteryCapacity = '100Ah';

    if (totalLoad > 1500) {
      inverterVA = 1625;
      batteryCapacity = '180-200Ah';
    } else if (totalLoad > 1000) {
      inverterVA = 1125;
      batteryCapacity = '150-160Ah';
    } else if (totalLoad > 600) {
      inverterVA = 900;
      batteryCapacity = '120Ah';
    }

    const result = document.getElementById('calculator-result');
    if (result) {
      result.innerHTML = `
        <div style="background: #e8f5e9; padding: 24px; border-radius: 8px; border-left: 4px solid #27ae60;">
          <h3 style="color: #27ae60; margin-bottom: 16px;">Based on Your Requirement:</h3>
          <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
            <div style="margin-bottom: 12px;">
              <strong>Estimated Load:</strong> ${totalLoad}W
            </div>
            <div style="margin-bottom: 12px;">
              <strong>Recommended Inverter:</strong> ${inverterVA}VA Pure Sine Wave
            </div>
            <div>
              <strong>Recommended Battery:</strong> ${batteryCapacity} Tubular Battery
            </div>
          </div>
          <p style="color: #666; margin-bottom: 16px; font-size: 0.95rem;">This is an estimated recommendation. For precise sizing, please contact our experts.</p>
          <a href="${basePath}index.html#quotation" class="btn btn-primary">Get Personalized Quote</a>
        </div>
      `;
    }
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