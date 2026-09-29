// ============================================================
// MAXVOLT — Header / navigation
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useProducts } from '@context/ProductsContext';
import { openWhatsapp, initialsFrom } from '@lib/utils';
import BrandLogo from './BrandLogo';

const BASE_NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/products',    label: 'Products' },
  { to: '/solutions',   label: 'Solutions' },
  { to: '/calculator',  label: 'Calculator' },
  { to: '/about',       label: 'About' },
  { to: '/contact',     label: 'Contact' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { hasActiveSale, comboSections } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = getCartCount();
  const hasCombo = comboSections && comboSections.length > 0;

  // Build nav links dynamically
  const navLinks = [...BASE_NAV_LINKS];
  if (hasActiveSale) {
    navLinks.splice(2, 0, { to: '/sale', label: '🔥 Sale', highlight: 'sale' });
  }
  if (hasCombo) {
    navLinks.splice(hasActiveSale ? 3 : 2, 0, { to: '/combo', label: 'Combo Offers', highlight: 'combo' });
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleNavClick = (to, e) => {
    setIsMenuOpen(false);

    if (!to.includes('#')) return;

    const [path, hash] = to.split('#');
    const targetPath = path || '/';

    if (location.pathname !== targetPath) return;

    if (e) e.preventDefault();
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(to, { replace: true });
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="hidden md:block bg-gradient-to-r from-brand-dark via-brand to-accent text-white text-xs">
        <div className="container-custom flex items-center justify-between py-2 gap-3">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" />
            <span className="truncate">
              Genuine batteries · GST-inclusive pricing · Same-day delivery in Kolkata
            </span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveSale && (
              <Link
                to="/sale"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white font-bold text-[0.72rem] tracking-wide shadow-md hover:bg-red-600 transition-colors"
              >
                🔥 Sale Live
              </Link>
            )}
            <a
              href="tel:+917595941311"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-white font-bold text-[0.72rem] tracking-wide backdrop-blur-sm border border-white/15 hover:bg-black/40 hover:border-white/30 transition-all"
            >
              📞 +91 75959 41311
            </a>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-[1000] transition-all duration-200 backdrop-blur-xl border-b ${
          isScrolled
            ? 'bg-[rgba(5,7,13,0.92)] border-[var(--border-strong)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]'
            : 'bg-[rgba(5,7,13,0.78)] border-[var(--border)]'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between gap-3 h-16 lg:h-[72px]">
            {/* Hamburger */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </div>
            </button>

            {/* Logo */}
            <BrandLogo size="md" className="shrink-0" />

            {/* Desktop nav */}
            <nav className="hidden lg:flex flex-1 justify-center">
              <ul className="flex items-center gap-6 xl:gap-7">
                {navLinks.map((link) => {
                  const isActive =
                    link.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(link.to);

                  // Special styling for Sale / Combo
                  if (link.highlight === 'sale') {
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          onClick={(e) => handleNavClick(link.to, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.85rem] font-bold transition-all ${
                            isActive
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/40'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                          }`}
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                          Sale
                        </Link>
                      </li>
                    );
                  }
                  if (link.highlight === 'combo') {
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          onClick={(e) => handleNavClick(link.to, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.85rem] font-bold transition-all ${
                            isActive
                              ? 'bg-accent text-white shadow-md shadow-accent/40'
                              : 'bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25'
                          }`}
                        >
                          🎁 Combo
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        onClick={(e) => handleNavClick(link.to, e)}
                        className={`nav-link ${isActive ? 'text-[var(--text)]' : ''}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {!isAdmin && (
                    <Link
                      to="/account/orders"
                      className="hidden md:inline-flex items-center px-3.5 py-2 rounded-xl border-[1.5px] border-[var(--border-strong)] text-[var(--text)] text-[0.85rem] font-semibold hover:bg-[var(--bg-muted)] hover:border-brand transition-all"
                    >
                      My Orders
                    </Link>
                  )}
                  <Link
                    to={isAdmin ? '/admin' : '/account/profile'}
                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-[1.5px] border-[var(--border-strong)] text-[var(--text)] text-[0.85rem] font-semibold hover:bg-[var(--bg-muted)] hover:border-brand transition-all"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-brand-dark grid place-items-center text-[10px] font-bold text-white">
                      {initialsFrom(user.displayName || user.email)}
                    </span>
                    <span className="hidden lg:inline">
                      {isAdmin ? 'Admin' : 'Account'}
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/account/login"
                  className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl border-[1.5px] border-[var(--border-strong)] text-[var(--text)] text-[0.85rem] font-semibold hover:bg-[var(--bg-muted)] hover:border-brand transition-all"
                >
                  Sign in
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-[1.5px] border-[var(--border-strong)] text-[var(--text)] text-[0.85rem] font-semibold hover:bg-[var(--bg-muted)] hover:border-brand transition-all"
                aria-label={`Cart with ${cartCount} items`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="hidden lg:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[0.65rem] font-bold rounded-full grid place-items-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* WhatsApp */}
              <button
                onClick={() => openWhatsapp()}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#25D366] to-[#1FAA50] text-white text-[0.85rem] font-semibold shadow-md shadow-[#25D366]/25 hover:shadow-lg hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span className="hidden lg:inline">WhatsApp</span>
              </button>

              {/* Get Quote */}
              <Link
                to="/contact#quotation"
                className="hidden md:inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white text-[0.85rem] font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          className={`lg:hidden border-t border-[var(--border)] bg-[rgba(5,7,13,0.98)] backdrop-blur-xl overflow-hidden transition-[max-height,opacity] duration-300 ${
            isMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!isMenuOpen}
        >
          <div className="container-custom py-5 max-h-[75vh] overflow-y-auto">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => {
                if (link.highlight === 'sale') {
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/25 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        Sale Live
                      </Link>
                    </li>
                  );
                }
                if (link.highlight === 'combo') {
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent font-bold hover:bg-accent/25 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        🎁 Combo Offers
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="block px-4 py-3 rounded-xl text-[var(--text)] font-medium hover:bg-[var(--bg-muted)] transition-colors"
                      onClick={(e) => handleNavClick(link.to, e)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-3 mt-3 border-t border-[var(--border)] flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      to={isAdmin ? '/admin' : '/account/profile'}
                      className="block px-4 py-3 rounded-xl text-center border-[1.5px] border-[var(--border-strong)] font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {isAdmin ? 'Admin Panel' : 'My Account'}
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/account/profile"
                        className="block px-4 py-3 rounded-xl text-center border-[1.5px] border-[var(--border-strong)] font-semibold"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/account/orders"
                        className="block px-4 py-3 rounded-xl text-center border-[1.5px] border-[var(--border-strong)] font-semibold"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    to="/account/login"
                    className="block px-4 py-3 rounded-xl text-center border-[1.5px] border-[var(--border-strong)] font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in / Register
                  </Link>
                )}
                <button
                  onClick={() => { openWhatsapp(); setIsMenuOpen(false); }}
                  className="block w-full px-4 py-3 rounded-xl text-center bg-gradient-to-b from-[#25D366] to-[#1FAA50] text-white font-semibold"
                >
                  <WhatsAppIcon className="w-4 h-4 inline mr-2" />
                  WhatsApp
                </button>
                <Link
                  to="/contact#quotation"
                  className="block px-4 py-3 rounded-xl text-center bg-gradient-to-b from-accent to-accent-dark text-white font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get a Quote
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/60 z-[999] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}