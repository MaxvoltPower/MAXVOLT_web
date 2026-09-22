// ============================================================
// MAXVOLT — Product grid
// ============================================================

import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '@components/ui/Skeleton';

export default function ProductGrid({ products, loading, emptyMessage }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-6xl mb-4 opacity-60">🔋</div>
        <h3 className="text-[var(--text)] mb-2 text-lg">
          {emptyMessage || 'No products found'}
        </h3>
        <p className="text-[var(--text-subtle)] text-sm max-w-md mx-auto">
          Try clearing filters or searching for something else. If you're looking
          for a specific product, reach out on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id || product._id} product={product} />
      ))}
    </div>
  );
}