import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { api } from '@lib/api';
import { formatPrice, formatDate } from '@lib/utils';
import ProfileForm from '@components/account/ProfileForm';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOutUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirect_after_login', '/account/profile');
      navigate('/account/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getOrders().catch(() => []),
    ])
      .then(([ordersData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="container-custom py-20 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const activeOrders = orders.filter(
    (o) => !['delivered', 'cancelled'].includes(o.status)
  ).length;

  return (
    <div className="container-custom py-10 sm:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="mb-1">My Account</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            Welcome back, {profile?.displayName || user.displayName || user.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button onClick={() => navigate('/admin')} variant="secondary" size="sm">
              Admin Panel
            </Button>
          )}
          <Button onClick={() => navigate('/account/orders')} variant="outline" size="sm">
            All Orders
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="surface text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            Total Orders
          </div>
          <div className="text-3xl font-extrabold text-[var(--text)]">
            {orders.length}
          </div>
        </div>
        <div className="surface text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            Active Orders
          </div>
          <div className="text-3xl font-extrabold text-secondary-light">
            {activeOrders}
          </div>
        </div>
        <div className="surface text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            Total Spent
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {formatPrice(totalSpent)}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Recent Orders</h2>
          {orders.length > 0 && (
            <Link to="/account/orders" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="surface text-center py-10 text-[var(--text-subtle)]">
            Loading orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="surface text-center py-10">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-[var(--text-muted)] mb-4">No orders yet.</p>
            <Link
              to="/products"
              className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order._id} className="surface flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm mb-1">
                    Order #{String(order._id).slice(-8).toUpperCase()}
                  </div>
                  <div className="text-xs text-[var(--text-subtle)]">
                    {formatDate(order.createdAt)} · {order.items?.length || 0} item(s)
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={order.status}>{order.status}</Badge>
                  <span className="font-semibold text-sm">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile form */}
      <div>
        <h2 className="text-xl mb-4">Profile Details</h2>
        <ProfileForm />
      </div>
    </div>
  );
}