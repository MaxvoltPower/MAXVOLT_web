// ============================================
// MAXVOLT — Cart Management (localStorage-based)
// ============================================

const CART_KEY = 'maxvolt_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

function addToCart(product, qty = 1) {
  if (!product || !product.id) {
    alert('Invalid product');
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  // Get numeric price (use lower bound of range if it's a range)
  const numericPrice = parsePriceToNumber(product.price);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      brand: product.brand,
      model: product.model,
      capacity: product.capacity,
      price: product.price,          // Original display price (e.g., "12000 - 13500")
      numericPrice,                  // For calculation
      image: product.image || null,
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
  return getCart().reduce((sum, item) => sum + (item.numericPrice * item.qty), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// Parse "12000 - 13500" → 12000 (use lower bound for estimation)
// Parse "12500" → 12500
function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;

  const str = String(priceStr).replace(/[₹,]/g, '').trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Update cart badge in header (all pages)
function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function showCartToast(message) {
  // Remove existing toast
  document.querySelectorAll('.cart-toast').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.innerHTML = `
    <span style="font-size:1.25rem;">✓</span>
    <span>${message}</span>
    <a href="cart.html" class="cart-toast-link">View Cart</a>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Auto-update badge on page load + cart changes
document.addEventListener('DOMContentLoaded', updateCartBadge);
window.addEventListener('cart-updated', updateCartBadge);

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
};