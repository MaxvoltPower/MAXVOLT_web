import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import {
  openWhatsapp,
  getWhatsappMessage,
  formatPrice,
  resolveProductImages,
} from '@lib/utils';
import Button from '@components/ui/Button';

export default function ProductDetail({ product }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);

  // Build a clean array of usable image URLs (never contains null/undefined)
  const images = useMemo(() => resolveProductImages(product), [product]);

  // Reset state whenever the product changes
  useEffect(() => {
    setSelectedImage(0);
    setMainImageError(false);
  }, [product?.id, product?._id]);

  useEffect(() => {
    if (searchParams.get('action') === 'addToCart' && product) {
      addToCart(product, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeIndex = Math.min(selectedImage, Math.max(0, images.length - 1));
  const mainImage = images[safeIndex] || null;

  // Reset the error flag whenever the selected image changes
  useEffect(() => {
    setMainImageError(false);
  }, [safeIndex, mainImage]);

  const showPrev = useCallback(() => {
    if (images.length < 2) return;
    setSelectedImage((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    if (images.length < 2) return;
    setSelectedImage((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard shortcuts for the lightbox
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, showPrev, showNext]);

  if (!product) return null;

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
      {/* ------------------------------------------------------------
          IMAGE GALLERY
          ------------------------------------------------------------ */}
      <div className="min-w-0">
        {/* Main image frame
            - Uses aspect ratio so it scales fluidly on every screen size.
            - Inner flex centering ensures the image is never clipped.
            - `object-contain` + `max-h-full max-w-full` keeps it fully visible. */}
        <div
          className={`relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] overflow-hidden mb-4 sm:mb-5 ${
            mainImage && !mainImageError ? 'cursor-zoom-in' : ''
          }`}
          onClick={() => {
            if (mainImage && !mainImageError) setLightboxOpen(true);
          }}
          role={mainImage ? 'button' : undefined}
          tabIndex={mainImage ? 0 : -1}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && mainImage && !mainImageError) {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
          aria-label={mainImage ? 'Open image viewer' : undefined}
        >
          {/* Inner padded flex wrapper — keeps padding consistent and the
              image perfectly centered without grid quirks. */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {mainImage && !mainImageError ? (
              <img
                key={mainImage}
                src={mainImage}
                alt={`${product.brand || ''} ${product.model || ''}`.trim()}
                className="block max-w-full max-h-full w-auto h-auto object-contain select-none"
                draggable={false}
                onError={() => setMainImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <span className="text-5xl sm:text-6xl">🔋</span>
                <span className="text-[0.65rem] sm:text-xs font-bold tracking-[0.25em] text-[var(--text-subtle)]">
                  MAXVOLT
                </span>
              </div>
            )}
          </div>

          {/* Image counter badge */}
          {images.length > 1 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[0.7rem] font-semibold tabular-nums pointer-events-none">
              {safeIndex + 1} / {images.length}
            </span>
          )}

          {/* Prev / Next overlay arrows (only when there are multiple images) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous image"
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/20 hover:bg-accent hover:border-accent transition-all"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next image"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/20 hover:bg-accent hover:border-accent transition-all"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setSelectedImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === safeIndex}
                className={`relative aspect-square rounded-lg bg-[var(--bg-muted)] border-2 overflow-hidden transition-all ${
                  i === safeIndex
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-[var(--border)] hover:border-accent/60'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center p-1.5">
                  <img
                    src={img}
                    alt=""
                    className="block max-w-full max-h-full w-auto h-auto object-contain"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.thumb-fallback')) {
                        const span = document.createElement('span');
                        span.className = 'thumb-fallback text-lg';
                        span.textContent = '🔋';
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------
          LIGHTBOX
          ------------------------------------------------------------ */}
      {lightboxOpen && mainImage && !mainImageError && (
        <div
          className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          {/* Close */}
          <button
            type="button"
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl backdrop-blur-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Close image viewer"
          >
            ✕
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold tabular-nums backdrop-blur-sm">
              {safeIndex + 1} / {images.length}
            </span>
          )}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous image"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next image"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Image — constrained so it always fits inside the viewport */}
          <img
            src={mainImage}
            alt={product.model}
            className="block max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain select-none"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ------------------------------------------------------------
          PRODUCT INFO
          ------------------------------------------------------------ */}
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
          {product.brand}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-5">{product.model}</h1>

        <div className="surface mb-6">
          <h3 className="text-lg font-bold mb-3">Key Specifications</h3>
          <div className="grid gap-2 text-sm">
            {product.capacity && (
              <div>
                <strong>Capacity:</strong> {product.capacity}
              </div>
            )}
            {product.voltage && (
              <div>
                <strong>Voltage:</strong> {product.voltage}
              </div>
            )}
            {product.type && (
              <div>
                <strong>Type:</strong> {product.type}
              </div>
            )}
            {product.warranty && (
              <div>
                <strong>Warranty:</strong> {product.warranty}
              </div>
            )}
            {product.bestFor && (
              <div>
                <strong>Best For:</strong> {product.bestFor}
              </div>
            )}
            {product.suitableLoad && (
              <div>
                <strong>Suitable Load:</strong> {product.suitableLoad}
              </div>
            )}
            {product.va && (
              <div>
                <strong>VA Rating:</strong> {product.va}
              </div>
            )}
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
          <Button
            onClick={() => addToCart(product, 1)}
            variant="outline"
            className="w-full py-3.5"
          >
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
            Talk to our MAXVOLT experts. We'll recommend the right product based
            on your actual requirement.
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