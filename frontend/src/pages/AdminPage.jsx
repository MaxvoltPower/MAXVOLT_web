import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import AdminLayout from '@components/admin/AdminLayout';
import Dashboard from '@components/admin/Dashboard';
import ProductsManager from '@components/admin/ProductsManager';
import OrdersManager from '@components/admin/OrdersManager';
import QuotesManager from '@components/admin/QuotesManager';
import UsersManager from '@components/admin/UsersManager';
import SectionsManager from '@components/admin/SectionsManager';
import SettingsManager from '@components/admin/SettingsManager';
import ProfileForm from '@components/account/ProfileForm';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    // Only bounce to login if the user isn't signed in at all.
    // If they ARE signed in but not an admin, show an access-denied screen
    // (avoids an infinite redirect loop with /account/login).
    if (!loading && !user) {
      sessionStorage.setItem('redirect_after_login', '/admin');
      navigate('/account/login');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="container-custom py-20 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="mb-3">Admin Access Required</h1>
        <p className="mb-6 text-[var(--text-muted)]">
          You are signed in as <strong>{user.email}</strong>, but this account
          does not have admin privileges.
        </p>
        <p className="mb-6 text-sm text-[var(--text-subtle)]">
          Ask the site owner to add your email to <code>ADMIN_EMAILS</code>, or
          to promote your account from Admin → Users.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate('/account/profile')}
            className="inline-flex px-5 py-2.5 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted"
          >
            My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="sections" element={<SectionsManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="quotes" element={<QuotesManager />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="settings" element={<SettingsManager />} />
      </Route>
    </Routes>
  );
}

function AdminProfilePage() {
  return (
    <div>
      <h1 className="text-2xl mb-6">My Profile</h1>
      <ProfileForm />
    </div>
  );
}
