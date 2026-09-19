import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { api } from '@lib/api';
import { formatPrice, formatDate } from '@lib/utils';
import Badge from '@components/ui/Badge';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirect_after_login', '/account/orders');
      navigate('/account/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .getOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1>My Orders</h1>
        <Link
          to="/account/profile"
          className="inline-flex px-4 py-2 rounded-xl border-2 border-dark-border-strong text-sm font-semibold hover:bg-dark-muted hover:border-accent"
        >
          Back to Profile
        </Link>
      </div>

      {!orders.length ? (
        <div className="text-center py-16 text-[var(--text-subtle)]">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-[var(--text)] mb-2">No orders yet</h3>
          <p className="mb-6">Start shopping to see your orders here.</p>
          <Link
            to="/products"
            className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="surface">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <strong>Order #{String(order._id).slice(-8).toUpperCase()}</strong>
                <Badge variant={order.status}>{order.status}</Badge>
              </div>
              <p className="text-sm mb-3">
                {order.items?.map((i) => `${i.model} × ${i.qty}`).join(', ')}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>
                  Total: <strong>{formatPrice(order.total)}</strong>
                </span>
                <span className="text-[var(--text-subtle)]">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}