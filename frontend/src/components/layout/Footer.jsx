// ============================================================
// MAXVOLT — Footer
// ============================================================

import { Link } from 'react-router-dom';
import { openWhatsapp, CONFIG } from '@lib/utils';

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { to: '/',                label: 'Home' },
    { to: '/products',        label: 'Products' },
    { to: '/#solutions',      label: 'Solutions' },
    { to: '/#calculator',     label: 'Calculator' },
    { to: '/#about',          label: 'About' },
    { to: '/#contact',        label: 'Contact' },
  ];

  const productLinks = [
    { to: '/products?category=homeInverterBatteries',  label: 'Home Inverter Batteries' },
    { to: '/products?category=carBatteries',           label: 'Car Batteries' },
    { to: '/products?category=totoErickshawBatteries', label: 'TOTO / E-Rickshaw' },
    { to: '/products?category=ebikeBatteries',         label: 'E-Bike Batteries' },
    { to: '/products?category=ups',                    label: 'UPS Systems' },
  ];

  return (
    <footer className="relative bg-[#05070D] text-white pt-16 sm:pt-20 pb-8 mt-16 border-t border-[var(--border)] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-accent to-brand" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="container-custom relative">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <img
              src="/assets/maxvolt-logo.png"
              alt="MAXVOLT"
              className="h-10 sm:h-11 w-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.footer-brand-fallback')) {
                  const div = document.createElement('div');
                  div.className = 'footer-brand-fallback text-2xl font-black text-gradient-brand mb-4 tracking-tight';
                  div.textContent = 'MAXVOLT';
                  parent.prepend(div);
                }
              }}
            />
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-subtle)] mb-3">
              ⚡ TRUSTED POWER ALWAYS
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
              Your trusted partner for genuine power and battery solutions in
              Kolkata. Verified brands, transparent pricing, expert installation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold mb-5 relative pb-3 text-white">
              Quick Links
              <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-accent rounded-full" />
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[var(--text-muted)] hover:text-white transition-colors inline-block hover:translate-x-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-bold mb-5 relative pb-3 text-white">
              Products
              <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-accent rounded-full" />
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[var(--text-muted)] hover:text-white transition-colors inline-block hover:translate-x-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-bold mb-5 relative pb-3 text-white">
              Contact
              <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-accent rounded-full" />
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="text-[var(--text-muted)] flex items-start gap-2">
                <span>📍</span>
                <span>Kolkata, West Bengal</span>
              </li>
              <li>
                <a
                  href={`tel:${CONFIG.phone.replace(/\s/g, '')}`}
                  className="text-[var(--text-muted)] hover:text-white inline-flex items-center gap-2 transition-colors"
                >
                  <span>📞</span>
                  {CONFIG.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONFIG.contactEmail}`}
                  className="text-[var(--text-muted)] hover:text-white inline-flex items-center gap-2 break-all transition-colors"
                >
                  <span>📧</span>
                  {CONFIG.contactEmail}
                </a>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => openWhatsapp()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#25D366] to-[#1FAA50] text-white text-sm font-semibold hover:-translate-y-0.5 shadow-md shadow-[#25D366]/25 hover:shadow-lg hover:shadow-[#25D366]/40 transition-all"
                >
                  WhatsApp
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[var(--text-subtle)]">
          <p>© {year} MAXVOLT. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}