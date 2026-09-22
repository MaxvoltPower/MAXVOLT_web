// ============================================================
// MAXVOLT — Cart context
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useToast } from '@components/ui/Toast';
import { parsePriceToNumber } from '@lib/utils';

const CartContext = createContext(null);
const CART_KEY = 'maxvolt_cart_v2';

function readCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readCartFromStorage);
  const { showToast } = useToast();

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      // Quota exceeded — silently ignore
    }
  }, [cart]);

  // Multi-tab sync (no toast)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== CART_KEY) return;
      try {
        const next = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(next)) setCart(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addToCart = useCallback(
    (product, qty = 1) => {
      const id = product?.id || product?._id;
      if (!product || !id) return;

      const numericPrice = parsePriceToNumber(
        product.discountedPrice || product.price
      );

      setCart((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, qty: Math.max(1, item.qty + qty) }
              : item
          );
        }
        return [
          ...prev,
          {
            id,
            brand: product.brand || '',
            model: product.model || '',
            capacity: product.capacity || '',
            price: product.price || null,
            discountedPrice: product.discountedPrice || null,
            numericPrice,
            image: product.images?.[0] || product.image || null,
            qty: Math.max(1, qty),
          },
        ];
      });

      showToast(
        `${product.brand || ''} ${product.model || 'Item'} added to cart`.trim(),
        'success'
      );
    },
    [showToast]
  );

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQty = useCallback(
    (productId, qty) => {
      if (qty < 1) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, qty: Math.min(qty, 99) } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.numericPrice) || 0) * (Number(item.qty) || 0),
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart]
  );

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    getCartTotal: () => cartTotal,
    getCartCount: () => cartCount,
    cartTotal,
    cartCount,
    parsePriceToNumber,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}