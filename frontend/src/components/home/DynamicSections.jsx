// ============================================================
// MAXVOLT — Dynamic homepage sections (admin-managed)
// ============================================================

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

  return (
    <>
      {sections.map((section) => {
        const sectionProducts = (section.products || [])
          .map((id) => findProductById(id))
          .filter(Boolean);

        if (sectionProducts.length === 0) return null;

        const isCombo = section.type === 'combo';
        const isSale = section.type === 'sale';
        const subtitle = isSale
          ? 'Limited time offers'
          : isCombo
          ? 'Bundle & save'
          : 'Hand-picked for you';

        return (
          <section key={section._id || section.title} className="section-padding">
            <div className="container-custom">
              <div className="section-header">
                {isCombo && (
                  <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-gradient-to-b from-accent to-accent-dark text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-accent/30">
                    🎁 Combo Offer
                  </span>
                )}
                {isSale && !isCombo && (
                  <span className="eyebrow">Limited Time</span>
                )}
                {!isSale && !isCombo && (
                  <span className="eyebrow">Featured</span>
                )}
                <h2>{section.title}</h2>
                <p>{subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {sectionProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>

              {isCombo && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => handleAddCombo(sectionProducts)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all"
                  >
                    🛒 Add Combo to Cart
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}