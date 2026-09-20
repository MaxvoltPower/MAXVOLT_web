import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import CartItem from '@components/cart/CartItem';
import CartSummary from '@components/cart/CartSummary';

export default function CartPage() {
  const { cart } = useCart();

  if (!cart.length) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-6xl mb-4 opacity-50">🛒</div>
        <h1 className="mb-4">Your Cart is Empty</h1>
        <p className="mb-6">Browse our products and add items to your cart.</p>
        <Link
          to="/products"
          className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:-translate-y-0.5 transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 sm:py-12">
      <h1 className="mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div>
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
        <CartSummary />
      </div>
    </div>
  );
}