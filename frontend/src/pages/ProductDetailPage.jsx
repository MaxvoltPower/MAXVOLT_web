import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '@context/ProductsContext';
import ProductDetail from '@components/products/ProductDetail';
import ProductGrid from '@components/products/ProductGrid';
import ReviewSection from '@components/products/ReviewSection';
import Button from '@components/ui/Button';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    findProductById,
    getProductsByCategory,
    normalizeCategory,
    loading,
    products,
  } = useProducts();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Wait until products have finished loading before deciding
    // whether the product exists.
    if (loading) return;

    const p = findProductById(id);
    if (p) {
      setProduct(p);
    } else {
      setProduct(null);
    }
  }, [id, findProductById, loading, products]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">🔋</div>
        <p className="text-[var(--text-muted)]">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-5xl mb-4 opacity-60">🔍</div>
        <h1 className="mb-4">Product Not Found</h1>
        <p className="mb-6 text-[var(--text-muted)]">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/products')} variant="primary">
          Browse Products
        </Button>
      </div>
    );
  }

  const cat = normalizeCategory(product.category);
  const pool = getProductsByCategory(cat).filter(
    (p) => (p.id || p._id) !== (product.id || product._id)
  );
  const sameBrand = pool.filter((p) => p.brand === product.brand);
  const related = (sameBrand.length >= 3 ? sameBrand : pool).slice(0, 4);

  return (
    <>
      <div className="bg-[var(--bg-subtle)] border-b border-[var(--border)] py-4">
        <div className="container-custom flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-brand-light hover:text-accent-light font-medium">
            Home
          </Link>
          <span className="text-[var(--text-subtle)]">/</span>
          <Link to="/products" className="text-brand-light hover:text-accent-light font-medium">
            Products
          </Link>
          <span className="text-[var(--text-subtle)]">/</span>
          <span className="text-[var(--text-muted)]">{product.model}</span>
        </div>
      </div>

      <section className="container-custom py-10 sm:py-16">
        <ProductDetail product={product} />
      </section>

      <ReviewSection productId={product.id || product._id} />

      {related.length > 0 && (
        <section className="band">
          <div className="section-header">
            <h2>Related Products</h2>
            <p>You might also be interested in</p>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}