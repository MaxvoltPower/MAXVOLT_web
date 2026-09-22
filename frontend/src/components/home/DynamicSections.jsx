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
    products.forEach((p) => addToCart(p, 1));
    // Single aggregate toast — addToCart also fires one; keep it simple
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
          <section
            key={section._id || section.title}
            className="section-padding"
          >
            <div className="container-custom">
              <div className="section-header">
                {isCombo && (
                  <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-gradient-to-br from-secondary to-secondary-light text-white font-bold text-xs uppercase tracking-wider">
                    🎁 Combo Offer
                  </span>
                )}
                <h2>{section.title}</h2>
                <p>{subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {sectionProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                  />
                ))}
              </div>

              {isCombo && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => handleAddCombo(sectionProducts)}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
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