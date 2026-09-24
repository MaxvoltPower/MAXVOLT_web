import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { api } from '@lib/api';
import { formatPrice, formatDate, openWhatsapp } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    api
      .getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirect_after_login', '/account/orders');
      navigate('/account/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    try {
      await api.updateOrder(orderId, { status: 'cancelled' });
      showToast('Order cancelled', 'success');
      loadOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (authLoading || loading) {
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
          Back to Dashboard
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
          {orders.map((order) => {
            const isExpanded = expandedId === order._id;
            const canCancel = order.status === 'placed';
            return (
              <div key={order._id} className="surface">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <strong className="block">
                      Order #{String(order._id).slice(-8).toUpperCase()}
                    </strong>
                    <span className="text-xs text-[var(--text-subtle)]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status}>{order.status}</Badge>
                    <Badge variant={order.paymentStatus === 'paid' ? 'paid' : 'new'}>
                      {order.paymentStatus || 'pending'}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm mb-3 text-[var(--text-muted)]">
                  {order.items?.map((i) => `${i.model} × ${i.qty}`).join(', ')}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>
                    Total: <strong>{formatPrice(order.total)}</strong>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className="text-accent hover:underline text-sm"
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="text-red-400 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() =>
                        openWhatsapp(
                          `Hi MAXVOLT, I need help with order #${String(order._id).slice(-8).toUpperCase()}.`
                        )
                      }
                      className="text-[#25d366] hover:underline text-sm"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-border space-y-2 text-sm">
                    <div>
                      <strong className="text-[var(--text)]">Shipping:</strong>{' '}
                      <span className="text-[var(--text-muted)]">
                        {order.shipping?.name}, {order.shipping?.address},{' '}
                        {order.shipping?.city} — {order.shipping?.pincode}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[var(--text)]">Phone:</strong>{' '}
                      <span className="text-[var(--text-muted)]">
                        {order.shipping?.phone}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[var(--text)]">Payment method:</strong>{' '}
                      <span className="text-[var(--text-muted)]">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}