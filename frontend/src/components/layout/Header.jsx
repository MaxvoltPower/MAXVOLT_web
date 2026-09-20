import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { openWhatsapp } from '@lib/utils';
import Button from '@components/ui/Button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();

  const cartCount = getCartCount();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/#solutions', label: 'Solutions' },
    { href: '/#why-maxvolt', label: 'Why MAXVOLT' },
    { href: '/#about', label: 'About' },
    { href: '/#contact', label: 'Contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-[1000] border-b border-dark-border transition-shadow duration-200 ${
        isScrolled
          ? 'shadow-lg bg-[rgba(10,15,26,0.95)]'
          : 'shadow-sm bg-[rgba(10,15,26,0.85)]'
      } backdrop-blur-xl`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between gap-4 h-16 lg:h-[72px]">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-dark-muted transition-colors order-first"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <div className="flex flex-col gap-1.5">
              <span
                className={`w-5 h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${
                  isMenuOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[var(--text)] rounded-full transition-all duration-200 ${
                  isMenuOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </div>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 hover:scale-105 transition-transform">
            <img
              src="/assets/maxvolt-logo.png"
              alt="MAXVOLT - Trusted Power Always"
              className="h-10 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex flex-1 justify-center">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="relative text-[var(--text)] font-medium text-sm py-1.5 whitespace-nowrap transition-colors hover:text-secondary-light group"
                  >
                    {link.label}
                    <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-secondary to-secondary-light scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
            {user ? (
              <Link
                to={isAdmin ? '/admin' : '/account/profile'}
                className="hidden sm:inline-flex items-center px-3 lg:px-4 py-2 rounded-xl border-2 border-dark-border-strong text-[var(--text)] text-sm font-semibold hover:bg-dark-muted hover:border-accent transition-all"
              >
                {isAdmin ? 'Admin' : 'My Account'}
              </Link>
            ) : (
              <Link
                to="/account/login"
                className="hidden sm:inline-flex items-center px-3 lg:px-4 py-2 rounded-xl border-2 border-dark-border-strong text-[var(--text)] text-sm font-semibold hover:bg-dark-muted hover:border-accent transition-all"
              >
                Login
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative inline-flex items-center gap-1.5 px-2.5 lg:px-4 py-2 rounded-xl border-2 border-dark-border-strong text-[var(--text)] text-sm font-semibold hover:bg-dark-muted hover:border-accent transition-all"
            >
              <span className="text-base">🛒</span>
              <span className="hidden lg:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-secondary text-white text-[0.65rem] font-bold rounded-full grid place-items-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* WhatsApp */}
            <button
              onClick={() => openWhatsapp()}
              className="hidden md:inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white text-sm font-semibold shadow-md shadow-[#25d366]/35 hover:shadow-lg hover:shadow-[#25d366]/50 hover:-translate-y-0.5 transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>

            {/* Get Quote */}
            <Link
              to="/#quotation"
              className="hidden md:inline-flex items-center px-3 lg:px-5 py-2 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-sm font-semibold shadow-md shadow-secondary/35 hover:shadow-lg hover:shadow-secondary/50 hover:-translate-y-0.5 transition-all"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <nav className="lg:hidden border-t border-dark-border bg-[rgba(10,15,26,0.98)] backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="container-custom py-6">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="block px-4 py-3 rounded-xl text-[var(--text)] font-medium hover:bg-dark-muted transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-3 mt-3 border-t border-dark-border flex flex-col gap-2">
                {user ? (
                  <Link
                    to={isAdmin ? '/admin' : '/account/profile'}
                    className="block px-4 py-3 rounded-xl text-center border-2 border-dark-border-strong font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {isAdmin ? 'Admin Panel' : 'My Account'}
                  </Link>
                ) : (
                  <Link
                    to="/account/login"
                    className="block px-4 py-3 rounded-xl text-center border-2 border-dark-border-strong font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
                <button
                  onClick={() => {
                    openWhatsapp();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 rounded-xl text-center bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white font-semibold"
                >
                  <WhatsAppIcon className="w-4 h-4 inline mr-2" />
                  WhatsApp
                </button>
                <Link
                  to="/#quotation"
                  className="block px-4 py-3 rounded-xl text-center bg-gradient-to-br from-secondary to-secondary-light text-white font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get a Quote
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}