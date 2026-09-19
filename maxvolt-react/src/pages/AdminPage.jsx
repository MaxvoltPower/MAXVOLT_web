import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import AdminLayout from '@components/admin/AdminLayout';
import Dashboard from '@components/admin/Dashboard';
import ProductsManager from '@components/admin/ProductsManager';
import OrdersManager from '@components/admin/OrdersManager';
import QuotesManager from '@components/admin/QuotesManager';
import UsersManager from '@components/admin/UsersManager';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
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

  if (!user || !isAdmin) return null;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="quotes" element={<QuotesManager />} />
        <Route path="users" element={<UsersManager />} />
      </Route>
    </Routes>
  );
}