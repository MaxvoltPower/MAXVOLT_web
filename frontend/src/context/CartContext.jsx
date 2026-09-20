import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@components/ui/Toast';

const CartContext = createContext(null);
const CART_KEY = 'maxvolt_cart';

function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  const str = String(priceStr).replace(/[₹,\s]/g, '').trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const { showToast } = useToast();

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }, [cart]);

  // Listen for storage events (multi-tab sync)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === CART_KEY) {
        try {
          setCart(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setCart([]);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addToCart = useCallback((product, qty = 1) => {
    const id = product?.id || product?._id;
    if (!product || !id) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      const numericPrice = parsePriceToNumber(product.discountedPrice || product.price);

      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + qty } : item
        );
      }

      return [
        ...prev,
        {
          id,
          brand: product.brand,
          model: product.model,
          capacity: product.capacity,
          price: product.price,
          discountedPrice: product.discountedPrice || null,
          numericPrice,
          image: product.images?.[0] || product.image || null,
          qty,
        },
      ];
    });

    showToast(`${product.brand} ${product.model} added to cart`, 'success');
  }, [showToast]);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, qty } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce(
      (sum, item) => sum + (Number(item.numericPrice) || 0) * (Number(item.qty) || 0),
      0
    );
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [cart]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    getCartTotal,
    getCartCount,
    parsePriceToNumber,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}