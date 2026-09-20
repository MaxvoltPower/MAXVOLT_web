import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '@context/ProductsContext';
import ProductDetail from '@components/products/ProductDetail';
import ProductGrid from '@components/products/ProductGrid';
import Button from '@components/ui/Button';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    findProductById,
    getProductsByCategory,
    normalizeCategory,
    loading,
  } = useProducts();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const p = findProductById(id);
    if (p) {
      setProduct(p);
      setNotFound(false);
    } else if (!loading) {
      setNotFound(true);
    }
  }, [id, findProductById, loading]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-4xl mb-4">🔋</div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="mb-4">Product Not Found</h1>
        <p className="mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/products')} variant="primary">
          Browse Products
        </Button>
      </div>
    );
  }

  // Related products
  const cat = normalizeCategory(product.category);
  const pool = getProductsByCategory(cat).filter(
    (p) => (p.id || p._id) !== (product.id || product._id)
  );
  const sameBrand = pool.filter((p) => p.brand === product.brand);
  const related = (sameBrand.length >= 3 ? sameBrand : pool).slice(0, 4);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-dark-subtle border-b border-dark-border py-4">
        <div className="container-custom flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-accent hover:text-secondary-light font-medium">
            Home
          </Link>
          <span className="text-[var(--text-subtle)]">/</span>
          <Link
            to="/products"
            className="text-accent hover:text-secondary-light font-medium"
          >
            Products
          </Link>
          <span className="text-[var(--text-subtle)]">/</span>
          <span className="text-[var(--text-muted)]">{product.model}</span>
        </div>
      </div>

      <section className="container-custom py-10 sm:py-16">
        <ProductDetail product={product} />
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="light-bg">
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