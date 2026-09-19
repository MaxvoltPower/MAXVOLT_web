// ============================================
// MAXVOLT — Cart Management (localStorage-based)
// Fixed: badge now updates on ALL pages, immediately, everywhere.
// ============================================

const CART_KEY = 'maxvolt_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
  // Update badge synchronously
  updateCartBadge();
  // Notify other listeners
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
  // Notify other tabs/windows
  try {
    localStorage.setItem('maxvolt_cart_ts', String(Date.now()));
  } catch { /* ignore */ }
}

function addToCart(product, qty = 1) {
  const id = product && (product.id || product._id);
  if (!product || !id) {
    alert('Invalid product');
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const numericPrice = parsePriceToNumber(product.discountedPrice || product.price);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id,
      brand: product.brand,
      model: product.model,
      capacity: product.capacity,
      price: product.price,
      discountedPrice: product.discountedPrice || null,
      numericPrice,
      image: (product.images && product.images[0]) || product.image || null,
      qty,
    });
  }

  saveCart(cart);
  showCartToast(`${product.brand} ${product.model} added to cart`);
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  if (qty < 1) {
    removeFromCart(productId);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (Number(item.numericPrice) || 0) * (Number(item.qty) || 0), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  const str = String(priceStr).replace(/[₹,\s]/g, '').trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Update every .cart-badge element on the page.
 * Uses multiple strategies so it works even if badge element is added later.
 */
function updateCartBadge() {
  const count = getCartCount();
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(el => {
    el.textContent = String(count);
    el.style.display = count > 0 ? 'inline-flex' : 'none';
    el.setAttribute('aria-label', `${count} items in cart`);
  });
  return count;
}

function showCartToast(message) {
  document.querySelectorAll('.cart-toast').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.innerHTML = `
    <span style="font-size:1.25rem;">✓</span>
    <span>${message}</span>
    <a href="${typeof basePathForCart === 'function' ? basePathForCart() : ''}cart.html" class="cart-toast-link">View Cart</a>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function basePathForCart() {
  return window.location.pathname.includes('/products/') ||
         window.location.pathname.includes('/account/')
    ? '../'
    : '';
}

// ---------- Auto-update wiring ----------

// 1. On DOMContentLoaded (fresh page)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateCartBadge);
} else {
  updateCartBadge();
}

// 2. Whenever the cart changes in this tab
window.addEventListener('cart-updated', updateCartBadge);

// 3. When another tab changes the cart
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY || e.key === 'maxvolt_cart_ts') {
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: getCart() }));
  }
});

// 4. If a page loads the badge lazily (e.g. after JS renders header), re-scan
const badgeObserver = new MutationObserver(() => updateCartBadge());
if (document.body) {
  badgeObserver.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    badgeObserver.observe(document.body, { childList: true, subtree: true });
  });
}

// Expose globally
window.maxvoltCart = {
  getCart,
  addToCart,
  removeFromCart,
  updateQty,
  clearCart,
  getCartTotal,
  getCartCount,
  parsePriceToNumber,
  updateCartBadge,
};

// Expose a simple helper for pages that render badges dynamically
window.refreshCartBadge = updateCartBadge;