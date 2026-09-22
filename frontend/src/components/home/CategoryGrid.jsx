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
          <h2>Our Products</h2>
          <p>
            Everything your home, vehicle, or business needs for reliable backup
            power
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categoryData.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="group bg-dark-elevated border border-dark-border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-accent"
            >
              <div className="relative h-36 sm:h-40 lg:h-44 grid place-items-center text-5xl bg-gradient-to-br from-[#0f1e3d] to-[#142850] text-accent border-b border-dark-border overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.12),transparent_60%)]" />
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                  {cat.icon}
                </span>
              </div>
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl mb-2">
                  {cat.name}
                </h3>
                <p className="text-xs sm:text-sm flex-1 text-[var(--text-muted)] mb-4">
                  {cat.description}
                </p>
                <span className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white text-xs sm:text-sm font-semibold shadow-sm group-hover:shadow-lg group-hover:shadow-primary/50 group-hover:-translate-y-0.5 transition-all">
                  View Products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}