import { Link } from 'react-router-dom';
import { openWhatsapp, CONFIG } from '@lib/utils';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#050810] to-[#000407] text-white pt-16 pb-8 mt-16 border-t border-dark-border overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary via-accent to-secondary" />
      
      <div className="container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <img
              src="/assets/maxvolt-logo.png"
              alt="MAXVOLT"
              className="h-11 bg-white/95 px-2.5 py-1.5 rounded-lg mb-3"
            />
            <p className="text-sm text-white/65 mb-2">⚡ TRUSTED POWER ALWAYS</p>
            <p className="text-sm text-white/70">
              Your trusted partner for genuine power and battery solutions in Kolkata.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-4 relative pb-3">
              Quick Links
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'Products' },
                { to: '/#solutions', label: 'Solutions' },
                { to: '/#about', label: 'About' },
                { to: '/#contact', label: 'Contact' },
                { to: '/privacy-policy', label: 'Privacy Policy' },
                { to: '/terms-conditions', label: 'Terms & Conditions' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-white hover:pl-1.5 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-base font-bold mb-4 relative pb-3">
              Products
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/products?category=homeInverterBatteries', label: 'Home Inverter Batteries' },
                { to: '/products?category=carBatteries', label: 'Car Batteries' },
                { to: '/products?category=totoErickshawBatteries', label: 'TOTO / E-Rickshaw' },
                { to: '/products?category=ebikeBatteries', label: 'E-Bike Batteries' },
                { to: '/products?category=ups', label: 'UPS Systems' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-white hover:pl-1.5 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-bold mb-4 relative pb-3">
              Contact
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-secondary rounded-full" />
            </h3>
            <p className="text-sm text-white/85 mb-2">📍 Kolkata, West Bengal</p>
            <p className="text-sm mb-3">
              📧{' '}
              <a href={`mailto:${CONFIG.contactEmail}`} className="text-white/80 hover:text-white">
                {CONFIG.contactEmail}
              </a>
            </p>
            <button
              onClick={() => openWhatsapp()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
            >
              WhatsApp
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-center text-sm text-white/50">
          <p>&copy; {year} MAXVOLT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}