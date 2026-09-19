import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOutUser } = useAuth();
  const { showToast } = useToast();

  const navItems = [
    { path: '/admin', label: '📊 Dashboard', exact: true },
    { path: '/admin/products', label: '📦 Products' },
    { path: '/admin/orders', label: '🛒 Orders' },
    { path: '/admin/quotes', label: '💬 Quotes' },
    { path: '/admin/users', label: '👥 Users' },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOutUser();
    showToast('Signed out', 'success');
    navigate('/account/login');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <aside className="bg-dark-subtle border-r border-dark-border p-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link
          to="/"
          className="flex items-center gap-3 mb-8 px-2 hover:opacity-85 transition-opacity"
        >
          <img
            src="/assets/maxvolt-logo.png"
            alt="MAXVOLT"
            className="h-10 bg-white rounded-lg p-1"
          />
          <strong>Admin</strong>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive(item.path, item.exact)
                  ? 'bg-gradient-to-br from-primary-light to-primary text-white'
                  : 'text-[var(--text-muted)] hover:bg-dark-muted hover:text-[var(--text)]'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-3 pt-4 border-t border-dark-border space-y-1">
            <Link
              to="/"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm text-accent hover:bg-accent/10 transition-all"
            >
              🌐 View Site ↗
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              🚪 Logout
            </button>
          </div>
        </nav>

        {user && (
          <div className="mt-6 px-3 py-3 rounded-xl bg-dark-muted border border-dark-border">
            <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
              Signed in as
            </p>
            <p className="text-xs font-semibold truncate">{user.email}</p>
            {isAdmin && (
              <p className="text-[0.7rem] text-emerald-400 mt-1">● Admin</p>
            )}
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="p-6 lg:p-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}