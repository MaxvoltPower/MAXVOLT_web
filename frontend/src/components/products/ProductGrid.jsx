import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '@components/ui/Skeleton';

export default function ProductGrid({ products, loading, emptyMessage }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="col-span-full text-center py-16 text-[var(--text-subtle)]">
        <div className="text-5xl mb-3">🔋</div>
        <h3 className="text-[var(--text)] mb-2">{emptyMessage || 'No products found'}</h3>
        <p>Try clearing filters or searching for something else.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id || product._id} product={product} />
      ))}
    </div>
  );
}