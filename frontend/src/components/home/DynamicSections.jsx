import { useProducts } from '@context/ProductsContext';
import ProductCard from '@components/products/ProductCard';
import { useCart } from '@context/CartContext';
import { useToast } from '@components/ui/Toast';

export default function DynamicSections() {
  const { sections, findProductById } = useProducts();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  if (!sections || sections.length === 0) return null;

  const handleAddCombo = (products) => {
    if (!products?.length) return;
    products.forEach((p) => addToCart(p, 1));
    showToast(`${products.length} items added to cart`, 'success');
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
          <section key={section._id} className="section-padding dynamic-section">
            <div className="container-custom">
              <div className="section-header">
                <h2>{section.title}</h2>
                <p>{subtitle}</p>
              </div>

              {isCombo && (
                <div className="text-center mb-6">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-br from-secondary to-secondary-light text-white font-bold text-sm">
                    🎁 COMBO OFFER
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sectionProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                  />
                ))}
              </div>

              {isCombo && (
                <div className="text-center mt-6">
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