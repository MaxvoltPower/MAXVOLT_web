// ============================================================
// MAXVOLT — Product card
// ============================================================

import { Link } from 'react-router-dom';
import {
  openWhatsapp,
  getWhatsappMessage,
  resolveProductImage,
  formatPrice,
  getAvailabilityClass,
  parsePrice,
} from '@lib/utils';

function PlaceholderImage({ model }) {
  const letter = (model || 'M').trim().charAt(0).toUpperCase();
  return (
    <div className="w-full h-full grid place-items-center bg-gradient-to-br from-[#0d1526] via-[#12203a] to-[#16213a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(56,189,248,0.10),transparent_60%)]" />
      <div className="relative text-center">
        <div className="text-5xl mb-1">🔋</div>
        <div className="text-[10px] tracking-[0.3em] text-[var(--text-subtle)] font-bold">
          {letter}·MAXVOLT
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const productId = product.id || product._id;
  const imageSrc = resolveProductImage(product);
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const discounted = parsePrice(product.discountedPrice);
  const base = parsePrice(product.price);
  const hasDiscount =
    !discounted.invalid && !base.invalid && discounted.min < base.min;

  const displayPrice = hasDiscount ? product.discountedPrice : product.price;

  const availability = outOfStock
    ? 'Out of Stock'
    : product.availability || 'Available';
  const availabilityClass = getAvailabilityClass(availability);
  const availabilityStyles =
    availabilityClass === 'availability-available'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : availabilityClass === 'availability-usually'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <article className="group bg-dark-elevated border border-dark-border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-accent">
      <div className="relative h-44 sm:h-48 lg:h-52 border-b border-dark-border overflow-hidden">
        <Link
          to={`/product/${productId}`}
          className="block w-full h-full"
          aria-label={`View ${product.brand} ${product.model}`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`${product.brand || ''} ${product.model || ''}`.trim()}
              loading="lazy"
              className="w-full h-full object-contain p-3 bg-gradient-to-br from-[#0d1526] to-[#16213a] transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.img-fallback')) {
                  const div = document.createElement('div');
                  div.className = 'img-fallback absolute inset-0';
                  div.innerHTML =
                    '<div class="w-full h-full grid place-items-center bg-gradient-to-br from-[#0d1526] via-[#12203a] to-[#16213a]"><div class="text-center"><div class="text-5xl mb-1">🔋</div><div class="text-[10px] tracking-[0.3em] text-[var(--text-subtle)] font-bold">MAXVOLT</div></div></div>';
                  parent.appendChild(div);
                }
              }}
            />
          ) : (
            <PlaceholderImage model={product.model} />
          )}
        </Link>

        {hasDiscount && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-gradient-to-br from-secondary to-secondary-light text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
            Sale
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">
          {product.brand}
        </div>
        <h3 className="text-sm sm:text-base font-bold text-[var(--text)] mb-3 leading-snug line-clamp-2 min-h-[2.5rem]">
          <Link
            to={`/product/${productId}`}
            className="hover:text-secondary-light transition-colors"
          >
            {product.model}
          </Link>
        </h3>

        <dl className="space-y-1 text-xs sm:text-sm text-[var(--text-muted)] mb-3">
          {product.capacity && (
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-subtle)] font-medium">Capacity</dt>
              <dd className="truncate">{product.capacity}</dd>
            </div>
          )}
          {product.va && (
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-subtle)] font-medium">VA</dt>
              <dd className="truncate">{product.va}</dd>
            </div>
          )}
          {product.voltage && (
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-subtle)] font-medium">Voltage</dt>
              <dd className="truncate">{product.voltage}</dd>
            </div>
          )}
          {product.warranty && (
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-subtle)] font-medium">Warranty</dt>
              <dd className="truncate">{product.warranty}</dd>
            </div>
          )}
        </dl>

        <div className="my-2">
          {hasDiscount ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs line-through text-[var(--text-subtle)]">
                {formatPrice(product.price)}
              </span>
              <span className="text-lg font-extrabold text-emerald-400">
                {formatPrice(product.discountedPrice)}
              </span>
            </div>
          ) : (
            <div className="text-lg font-extrabold text-secondary-light">
              {formatPrice(product.price)}
            </div>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3 border ${availabilityStyles}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {availability}
        </span>

        <div className="flex gap-2 mt-auto">
          <Link
            to={`/product/${productId}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white text-xs sm:text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            View Details
          </Link>
          {outOfStock ? (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl border-2 border-dark-border-strong text-xs sm:text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <button
              onClick={() => openWhatsapp(getWhatsappMessage(product))}
              className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-xs sm:text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              WhatsApp
            </button>
          )}
        </div>
      </div>
    </article>
  );
}