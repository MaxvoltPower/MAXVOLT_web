import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import CheckoutForm from '@components/checkout/CheckoutForm';
import OrderSummary from '@components/checkout/OrderSummary';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user, loading: authLoading } = useAuth();

  // Require login
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirect_after_login', '/checkout');
      navigate('/account/login');
    }
  }, [user, authLoading, navigate]);

  // Redirect if empty cart
  useEffect(() => {
    if (!authLoading && user && !cart.length) {
      navigate('/cart');
    }
  }, [cart, user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="container-custom py-20 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleSuccess = ({ orderId, method }) => {
    navigate(`/order-success?id=${orderId}&method=${method}`);
  };

  return (
    <div className="container-custom py-10 sm:py-12">
      <h1 className="mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <CheckoutForm onSuccess={handleSuccess} />
        <aside>
          <OrderSummary />
        </aside>
      </div>
    </div>
  );
}