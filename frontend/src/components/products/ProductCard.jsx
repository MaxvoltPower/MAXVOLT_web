import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { openWhatsapp, getWhatsappMessage, resolveProductImage, formatPrice, getAvailabilityClass } from '@lib/utils';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const productId = product.id || product._id;
  const imageSrc = resolveProductImage(product);
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const priceHtml = product.discountedPrice ? (
    <>
      <span className="line-through text-[var(--text-subtle)] text-sm mr-2">
        {formatPrice(product.price)}
      </span>
      <span className="text-emerald-400 font-extrabold">
        {formatPrice(product.discountedPrice)}
      </span>
    </>
  ) : (
    formatPrice(product.price)
  );

  const availability = outOfStock ? 'Out of Stock' : product.availability || 'Available';
  const availabilityClass = getAvailabilityClass(availability);

  return (
    <article className="bg-dark-elevated border border-dark-border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-accent">
      <div className="relative h-48 sm:h-52 grid place-items-center bg-gradient-to-br from-[#0d1526] to-[#16213a] border-b border-dark-border overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.model}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML =
                '<div class="grid place-items-center h-full text-5xl text-[var(--text-subtle)]">🔋</div>';
            }}
          />
        ) : (
          <div className="grid place-items-center h-full text-5xl text-[var(--text-subtle)]">🔋</div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
          {product.brand}
        </div>
        <h3 className="text-base font-bold text-[var(--text)] mb-3 leading-snug">
          {product.model}
        </h3>

        <div className="space-y-1.5 text-sm text-[var(--text-muted)] mb-3">
          {product.capacity && (
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-subtle)] font-medium">Capacity</span>
              <span>{product.capacity}</span>
            </div>
          )}
          {product.va && (
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-subtle)] font-medium">VA</span>
              <span>{product.va}</span>
            </div>
          )}
          {product.voltage && (
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-subtle)] font-medium">Voltage</span>
              <span>{product.voltage}</span>
            </div>
          )}
          {product.warranty && (
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-subtle)] font-medium">Warranty</span>
              <span>{product.warranty}</span>
            </div>
          )}
        </div>

        <div className="text-xl font-extrabold text-secondary-light tracking-tight my-3">
          {priceHtml}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide mb-4 ${
            availabilityClass === 'availability-available'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : availabilityClass === 'availability-usually'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {availability}
        </span>

        <div className="flex gap-2 mt-auto">
          <Link
            to={`/product/${productId}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            View Details
          </Link>
          {outOfStock ? (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl border-2 border-dark-border-strong text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <button
              onClick={() => openWhatsapp(getWhatsappMessage(product))}
              className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              WhatsApp
            </button>
          )}
        </div>
      </div>
    </article>
  );
}