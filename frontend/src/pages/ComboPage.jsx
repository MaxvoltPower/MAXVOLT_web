// ============================================================
// MAXVOLT — Combo / bundle offers page
// ------------------------------------------------------------
// Lists every active combo section as a bundle card. Each bundle
// can be added to the cart in one click.
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@context/ProductsContext';
import { useCart } from '@context/CartContext';
import { useToast } from '@components/ui/Toast';
import ProductCard from '@components/products/ProductCard';
import { formatPrice, parsePriceToNumber } from '@lib/utils';

export default function ComboPage() {
  const { getComboBundles, loading } = useProducts();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const bundles = getComboBundles();

  const handleAddBundle = (products) => {
    if (!products?.length) return;
    let added = 0;
    products.forEach((p) => {
      try {
        addToCart(p, 1);
        added++;
      } catch {
        /* ignore */
      }
    });
    if (added > 0) {
      showToast(`Combo added — ${added} item(s) in cart`, 'success');
    }
  };

  const bundleTotal = (products) =>
    products.reduce(
      (sum, p) => sum + parsePriceToNumber(p.discountedPrice || p.price),
      0
    );

  return (
    <>
      <Helmet>
        <title>Combo Offers — MAXVOLT</title>
        <meta
          name="description"
          content="Bundle deals on inverters, batteries and power solutions from MAXVOLT Kolkata."
        />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-800 via-orange-700 to-[#7c2d12] text-white py-12 sm:py-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Combo Offers</span>
          </nav>

          <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            🎁 Bundle &amp; Save
          </span>

          <h1 className="text-white mb-3 text-3xl sm:text-4xl lg:text-5xl font-black">
            Combo Offers
          </h1>
          <p className="text-sm sm:text-base lg:text-lg opacity-90 max-w-2xl">
            Curated bundles — inverter + battery, multi-battery packs, and more.
            Add the whole set to your cart with one click.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="container-custom py-10 sm:py-12">
        {loading ? (
          <div className="text-center py-20 text-[var(--text-subtle)]">
            Loading combos...
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-16 sm:py-20 max-w-lg mx-auto">
            <div className="text-6xl mb-4 opacity-60">🎁</div>
            <h2 className="mb-3 text-[var(--text)]">No Combo Offers Yet</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              We don't have any active combo bundles at the moment. Check back
              soon, or browse our individual products.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/products"
                className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold hover:-translate-y-0.5 transition-all"
              >
                Browse Products
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
          <div className="space-y-12 sm:space-y-16">
            {bundles.map(({ section, products }) => {
              const total = bundleTotal(products);
              return (
                <div
                  key={section._id || section.title}
                  className="rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/5 to-transparent p-5 sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                        🎁 Combo
                      </span>
                      <h2 className="text-xl sm:text-2xl text-[var(--text)] mb-1">
                        {section.title}
                      </h2>
                      <p className="text-sm text-[var(--text-subtle)]">
                        {products.length} item{products.length === 1 ? '' : 's'} in this bundle
                        {total > 0 && (
                          <>
                            {' · '}
                            Bundle price from{' '}
                            <strong className="text-accent-light">
                              {formatPrice(total)}
                            </strong>
                          </>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddBundle(products)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all text-sm"
                    >
                      🛒 Add Combo to Cart
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id || product._id} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}