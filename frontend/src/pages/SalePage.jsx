// ============================================================
// MAXVOLT — Sale page
// ------------------------------------------------------------
// Aggregates every product that appears in ANY active section
// of type "sale" (created by the admin in /admin/sections).
// Shows a clear empty state if no sale is running.
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@context/ProductsContext';
import ProductGrid from '@components/products/ProductGrid';

export default function SalePage() {
  const { saleSections, getSaleProducts, loading } = useProducts();

  const products = getSaleProducts();
  const activeSectionCount = saleSections.length;

  return (
    <>
      <Helmet>
        <title>Sale — MAXVOLT</title>
        <meta
          name="description"
          content="Live sale on genuine batteries, inverters and power solutions at MAXVOLT Kolkata."
        />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-900 via-red-800 to-[#7f1d1d] text-white py-12 sm:py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2), transparent 40%)',
          }}
          aria-hidden="true"
        />
        <div className="container-custom relative">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Sale</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live Sale
            </span>
          </div>

          <h1 className="text-white mb-3 text-3xl sm:text-4xl lg:text-5xl font-black">
            🔥 Sale &amp; Offers
          </h1>
          <p className="text-sm sm:text-base lg:text-lg opacity-90 max-w-2xl">
            Limited-time pricing on genuine batteries, inverters and power
            solutions — while stocks last.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="container-custom py-10 sm:py-12">
        {loading ? (
          <div className="text-center py-20 text-[var(--text-subtle)]">
            Loading sale items...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-20 max-w-lg mx-auto">
            <div className="text-6xl mb-4 opacity-60">🏷️</div>
            <h2 className="mb-3 text-[var(--text)]">No Sale Running Right Now</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              We don't have any active sale sections at the moment. Check back
              soon, or browse our full range.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/products"
                className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold hover:-translate-y-0.5 transition-all"
              >
                Browse All Products
              </Link>
              <Link
                to="/contact"
                className="inline-flex px-6 py-3 rounded-xl border-[1.5px] border-[var(--border-strong)] font-semibold hover:bg-[var(--bg-muted)] transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl text-[var(--text)] mb-1">
                  On Sale Now
                </h2>
                <p className="text-sm text-[var(--text-subtle)]">
                  {products.length} product{products.length === 1 ? '' : 's'} across{' '}
                  {activeSectionCount} active sale{activeSectionCount === 1 ? '' : 's'}
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex px-4 py-2 rounded-xl border-[1.5px] border-[var(--border-strong)] text-sm font-semibold hover:bg-[var(--bg-muted)] transition-all"
              >
                View All Products
              </Link>
            </div>

            <ProductGrid
              products={products}
              loading={false}
              emptyMessage="No products in this sale"
            />
          </>
        )}
      </section>
    </>
  );
}