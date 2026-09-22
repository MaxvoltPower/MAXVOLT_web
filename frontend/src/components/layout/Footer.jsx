// ============================================================
// MAXVOLT — Footer
// ============================================================

import { Link } from 'react-router-dom';
import { openWhatsapp, CONFIG } from '@lib/utils';

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/#solutions', label: 'Solutions' },
    { to: '/#calculator', label: 'Calculator' },
    { to: '/#about', label: 'About' },
    { to: '/#contact', label: 'Contact' },
  ];

  const productLinks = [
    { to: '/products?category=homeInverterBatteries', label: 'Home Inverter Batteries' },
    { to: '/products?category=carBatteries', label: 'Car Batteries' },
    { to: '/products?category=totoErickshawBatteries', label: 'TOTO / E-Rickshaw' },
    { to: '/products?category=ebikeBatteries', label: 'E-Bike Batteries' },
    { to: '/products?category=ups', label: 'UPS Systems' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-[#050810] to-[#000407] text-white pt-14 sm:pt-16 pb-8 mt-12 sm:mt-16 border-t border-dark-border overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary via-accent to-secondary" />

      <div className="container-custom">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <img
              src="/assets/maxvolt-logo.png"
              alt="MAXVOLT"
              className="h-10 sm:h-11 bg-white/95 px-2.5 py-1.5 rounded-lg mb-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.insertAdjacentHTML(
                    'afterbegin',
                    '<div class="text-2xl font-black text-secondary-light mb-3">MAXVOLT</div>'
                  );
                }
              }}
            />
            <p className="text-sm text-white/65 mb-2 font-semibold tracking-wider">
              ⚡ TRUSTED POWER ALWAYS
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Your trusted partner for genuine power and battery solutions in
              Kolkata.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm sm:text-base font-bold mb-4 relative pb-3">
              Quick Links
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-white hover:pl-1.5 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm sm:text-base font-bold mb-4 relative pb-3">
              Products
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-white hover:pl-1.5 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-bold mb-4 relative pb-3">
              Contact
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="text-white/85">📍 Kolkata, West Bengal</li>
              <li>
                <a
                  href={`tel:${CONFIG.phone.replace(/\s/g, '')}`}
                  className="text-white/80 hover:text-white inline-flex items-center gap-2"
                >
                  📞 {CONFIG.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONFIG.contactEmail}`}
                  className="text-white/80 hover:text-white inline-flex items-center gap-2 break-all"
                >
                  📧 {CONFIG.contactEmail}
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => openWhatsapp()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
                >
                  WhatsApp
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs sm:text-sm text-white/50">
          <p>&copy; {year} MAXVOLT. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 justify-center">
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