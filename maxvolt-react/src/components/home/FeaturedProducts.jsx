import { useProducts } from '@context/ProductsContext';
import ProductCard from '@components/products/ProductCard';
import { ProductCardSkeleton } from '@components/ui/Skeleton';
import { Link } from 'react-router-dom';

export default function FeaturedProducts() {
  const { getFeaturedProducts, loading } = useProducts();
  const featured = getFeaturedProducts(4);

  return (
    <section id="featured-fallback" className="section-padding">
      <div className="container-custom">
        <div className="section-header">
          <h2>Featured Home Batteries</h2>
          <p>Popular choices from trusted brands</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.length > 0
            ? featured.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))
            : (
              <p className="col-span-full text-center text-[var(--text-subtle)]">
                No products available yet.
              </p>
            )}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/products?category=homeInverterBatteries"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            View All Home Batteries
          </Link>
        </div>
      </div>
    </section>
  );
}