// ============================================================
// MAXVOLT — Dynamic homepage sections (admin-managed)
// ------------------------------------------------------------
// Renders whatever the admin has created in /admin/sections:
//   featured  → normal product grid
//   sale      → highlighted with discount badge + "View all sale" link
//   combo     → bundle grid + "Add combo to cart"
//   new       → new arrivals styling
// ============================================================

import { Link } from 'react-router-dom';
import { useProducts } from '@context/ProductsContext';
import { useCart } from '@context/CartContext';
import { useToast } from '@components/ui/Toast';
import ProductCard from '@components/products/ProductCard';

export default function DynamicSections() {
  const { sections, findProductById } = useProducts();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  if (!sections || sections.length === 0) return null;

  const handleAddCombo = (products) => {
    if (!products?.length) return;
    let addedCount = 0;
    products.forEach((p) => {
      try {
        addToCart(p, 1);
        addedCount++;
      } catch {
        // ignore individual failures
      }
    });
    if (addedCount > 0) {
      showToast(`Combo added — ${addedCount} item(s) in cart`, 'success');
    }
  };

  // Sort: featured first, then sale, then combo, then new, then by order
  const typeRank = { featured: 0, sale: 1, combo: 2, new: 3 };
  const ordered = [...sections].sort((a, b) => {
    const ra = typeRank[a.type] ?? 99;
    const rb = typeRank[b.type] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <>
      {ordered.map((section) => {
        const sectionProducts = (section.products || [])
          .map((id) => findProductById(id))
          .filter(Boolean);

        if (sectionProducts.length === 0) return null;

        const isCombo = section.type === 'combo';
        const isSale = section.type === 'sale';
        const isNew = section.type === 'new';

        let eyebrow = 'Featured';
        let subtitle = 'Hand-picked for you';
        if (isSale) {
          eyebrow = '🔥 Limited Time';
          subtitle = 'Grab these offers before they end';
        } else if (isCombo) {
          eyebrow = '🎁 Combo Offer';
          subtitle = 'Bundle & save — add the whole set at once';
        } else if (isNew) {
          eyebrow = '✨ New Arrivals';
          subtitle = 'Freshly stocked';
        }

        return (
          <section
            key={section._id || section.title}
            id={`section-${section._id || section.type}`}
            className="section-padding"
          >
            <div className="container-custom">
              <div className="section-header">
                {isCombo ? (
                  <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-gradient-to-b from-accent to-accent-dark text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-accent/30">
                    🎁 Combo Offer
                  </span>
                ) : (
                  <span
                    className={`eyebrow ${
                      isSale ? 'text-red-400' : isNew ? 'text-emerald-400' : ''
                    }`}
                  >
                    {eyebrow}
                  </span>
                )}
                <h2>{section.title}</h2>
                <p>{subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {sectionProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>

              {/* Combo: add entire bundle */}
              {isCombo && (
                <div className="text-center mt-10">
                  <button
                    type="button"
                    onClick={() => handleAddCombo(sectionProducts)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all"
                  >
                    🛒 Add Whole Combo to Cart
                  </button>
                  <p className="text-xs text-[var(--text-subtle)] mt-2">
                    {sectionProducts.length} item(s) will be added
                  </p>
                </div>
              )}

              {/* Sale: link to dedicated sale page */}
              {isSale && (
                <div className="text-center mt-10">
                  <Link
                    to="/sale"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    🔥 View All Sale Items
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}