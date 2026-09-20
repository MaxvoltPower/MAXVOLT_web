import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { formatPrice } from '@lib/utils';

export default function CartSummary() {
  const { getCartTotal, getCartCount } = useCart();
  const total = getCartTotal();
  const count = getCartCount();

  return (
    <aside className="bg-dark-elevated border border-dark-border rounded-2xl p-6 sticky top-24">
      <h3 className="text-xl font-bold mb-5">Order Summary</h3>

      <div className="flex justify-between mb-3 text-sm">
        <span>Items ({count})</span>
        <span className="font-semibold">{formatPrice(total)}</span>
      </div>

      <div className="flex justify-between mb-3 text-sm">
        <span>Delivery</span>
        <span className="text-[var(--text-subtle)]">Calculated at checkout</span>
      </div>

      <div className="flex justify-between pt-4 mt-4 border-t-2 border-dark-border font-extrabold text-xl">
        <span>Total</span>
        <span className="text-secondary-light">{formatPrice(total)}</span>
      </div>

      <Link
        to="/checkout"
        className="block w-full mt-5 text-center px-6 py-3.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        Proceed to Checkout →
      </Link>

      <Link
        to="/products"
        className="block w-full mt-2 text-center px-6 py-3.5 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted hover:border-accent transition-all"
      >
        Continue Shopping
      </Link>
    </aside>
  );
}