// ============================================================
// MAXVOLT — Admin layout (responsive sidebar)
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';
import BrandLogo from '@components/layout/BrandLogo';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOutUser } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/categories', label: 'Categories', icon: '🗂️' },
    { path: '/admin/sections', label: 'Sections', icon: '🏷️' },
    { path: '/admin/orders', label: 'Orders', icon: '🛒' },
    { path: '/admin/quotes', label: 'Quotes', icon: '💬' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/profile', label: 'My Profile', icon: '👤' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  // Close on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await signOutUser();
    showToast('Signed out', 'success');
    navigate('/account/login');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-screen">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-16 z-40 bg-[var(--bg-elev)] border-b border-[var(--border)] px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-muted)]"
          aria-label="Open admin menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-semibold">Admin Menu</span>
        </button>
        <Link
          to="/admin/profile"
          className="text-xs text-[var(--text-subtle)] truncate max-w-[140px] hover:text-accent"
        >
          {user?.email}
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar bg-[var(--bg-elev)] border-r border-[var(--border)] p-5 lg:p-6 fixed lg:sticky top-0 h-screen overflow-y-auto z-[1001] w-[280px] max-w-[85vw] transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/admin"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
          >
            <BrandLogo size="sm" showTagline={false} as="static" />
            <span className="text-[0.7rem] uppercase tracking-[0.2em] font-bold text-[var(--text-subtle)] border-l border-[var(--border-strong)] pl-2">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-muted)]"
            aria-label="Close admin menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive(item.path, item.exact)
                  ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/25'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="mt-3 pt-4 border-t border-[var(--border)] space-y-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm text-accent hover:bg-accent/10 transition-all"
            >
              <span>🌐</span> View Site ↗
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </nav>

        {user && (
          <div className="mt-6 px-3 py-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
            <p className="text-[0.65rem] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
              Signed in as
            </p>
            <p className="text-xs font-semibold truncate">{user.email}</p>
            {isAdmin && (
              <p className="text-[0.7rem] text-emerald-400 mt-1">● Admin</p>
            )}
          </div>
        )}
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1000] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}