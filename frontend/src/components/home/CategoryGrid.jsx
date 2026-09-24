// ============================================================
// MAXVOLT — Product category grid
// ============================================================

import { Link } from 'react-router-dom';
import { categoryData } from '@data/products';

export default function CategoryGrid() {
  return (
    <section id="products" className="section-padding">
      <div className="container-custom">
        <div className="section-header">
          <span className="eyebrow">Product Range</span>
          <h2>Our Products</h2>
          <p>
            Everything your home, vehicle, or business needs for reliable backup
            power — sourced from verified brands only.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categoryData.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="group relative bg-[var(--bg-elev)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-card flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-lg hover:border-brand/60"
            >
              {/* Icon panel */}
              <div className="relative h-36 sm:h-40 lg:h-44 grid place-items-center text-5xl bg-gradient-to-br from-[#0B1220] via-[#0E1A2E] to-[#121A2A] border-b border-[var(--border)] overflow-hidden">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(11,95,255,0.18), transparent 60%)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                  aria-hidden="true"
                />
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_4px_12px_rgba(11,95,255,0.4)]">
                  {cat.icon}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl mb-2 group-hover:text-accent-light transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs sm:text-sm flex-1 text-[var(--text-muted)] mb-5 leading-relaxed">
                  {cat.description}
                </p>
                <span className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand/25 group-hover:shadow-lg group-hover:shadow-brand/40 group-hover:-translate-y-0.5 transition-all">
                  View Products
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}