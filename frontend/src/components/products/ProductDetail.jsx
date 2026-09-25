import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { openWhatsapp, getWhatsappMessage, formatPrice, resolveProductImage } from '@lib/utils';
import Button from '@components/ui/Button';

export default function ProductDetail({ product }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'addToCart' && product) {
      addToCart(product, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!product) return null;

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const mainImage = images[selectedImage];

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
      {/* Image Gallery */}
      <div>
        <div
          className="relative h-80 sm:h-[400px] rounded-2xl bg-dark-muted border border-dark-border grid place-items-center overflow-hidden mb-5 cursor-zoom-in"
          onClick={() => mainImage && setLightboxOpen(true)}
        >
          {mainImage ? (
            <img
              src={resolveProductImage({ image: mainImage })}
              alt={product.model}
              className="w-full h-full object-contain p-6 transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <span className="text-6xl">🔋</span>
          )}
        </div>

        {lightboxOpen && mainImage && (
          <div
            className="fixed inset-0 z-[3000] bg-black/95 grid place-items-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white text-3xl hover:text-accent transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <img
              src={resolveProductImage({ image: mainImage })}
              alt={product.model}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`aspect-square rounded-lg bg-[var(--bg-muted)] border-2 p-1 transition-all ${
                  i === selectedImage
                    ? 'border-accent'
                    : 'border-[var(--border)] hover:border-accent'
                }`}
              >
                <img
                  src={resolveProductImage({ image: img })}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
          {product.brand}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-5">{product.model}</h1>

        <div className="surface mb-6">
          <h3 className="text-lg font-bold mb-3">Key Specifications</h3>
          <div className="grid gap-2 text-sm">
            {product.capacity && <div><strong>Capacity:</strong> {product.capacity}</div>}
            {product.voltage && <div><strong>Voltage:</strong> {product.voltage}</div>}
            {product.type && <div><strong>Type:</strong> {product.type}</div>}
            {product.warranty && <div><strong>Warranty:</strong> {product.warranty}</div>}
            {product.bestFor && <div><strong>Best For:</strong> {product.bestFor}</div>}
            {product.suitableLoad && <div><strong>Suitable Load:</strong> {product.suitableLoad}</div>}
            {product.va && <div><strong>VA Rating:</strong> {product.va}</div>}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/30 mb-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            Price
          </div>
          <div className="text-3xl font-extrabold text-accent-light">
            {product.discountedPrice ? (
              <>
                <span className="line-through text-lg text-[var(--text-subtle)] mr-2">
                  {formatPrice(product.price)}
                </span>
                {formatPrice(product.discountedPrice)}
              </>
            ) : (
              formatPrice(product.price)
            )}
          </div>
          <div className="text-xs text-[var(--text-subtle)] mt-1.5">
            Inclusive of GST. Final price confirmed at checkout.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button onClick={handleBuyNow} variant="primary" className="w-full py-3.5">
            🛒 Buy Now
          </Button>
          <Button onClick={() => addToCart(product, 1)} variant="outline" className="w-full py-3.5">
            Add to Cart
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => openWhatsapp(getWhatsappMessage(product))}
            variant="secondary"
            className="w-full py-3.5"
          >
            💬 WhatsApp
          </Button>
          <Link
            to="/contact#quotation"
            className="inline-flex items-center justify-center w-full py-3.5 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted hover:border-accent transition-all"
          >
            📋 Get Quote
          </Link>
        </div>

        <div className="surface">
          <h4 className="font-bold mb-2">Not Sure?</h4>
          <p className="text-sm mb-3">
            Talk to our MAXVOLT experts. We'll recommend the right product based on your actual requirement.
          </p>
          <Link
            to="/contact#quotation"
            className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
          >
            Get Expert Help
          </Link>
        </div>
      </div>
    </div>
  );
}