// ============================================================
// MAXVOLT — Cart item row
// ============================================================

import { useCart } from '@context/CartContext';
import { resolveProductImage, formatINR } from '@lib/utils';

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useCart();
  const imageSrc = resolveProductImage({ image: item.image });

  return (
    <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr_auto_auto] gap-3 sm:gap-4 items-start sm:items-center p-3 sm:p-4 bg-dark-elevated border border-dark-border rounded-2xl mb-3">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-dark-muted grid place-items-center overflow-hidden shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-contain p-1.5"
            onError={(e) => {
              e.currentTarget.replaceWith(
                Object.assign(document.createElement('span'), {
                  className: 'text-3xl',
                  textContent: '🔋',
                })
              );
            }}
          />
        ) : (
          <span className="text-3xl">🔋</span>
        )}
      </div>

      <div className="min-w-0">
        <h4 className="font-bold text-sm mb-0.5 truncate">
          {item.brand} {item.model}
        </h4>
        {item.capacity && (
          <p className="text-xs text-[var(--text-subtle)] mb-1">
            {item.capacity}
          </p>
        )}
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-xs text-red-400 hover:text-red-300 hover:underline mt-1"
          aria-label={`Remove ${item.model}`}
        >
          Remove
        </button>
      </div>

      <div className="col-start-1 col-end-3 sm:col-auto justify-self-start sm:justify-self-auto inline-flex items-center gap-1.5 bg-dark-muted p-1 rounded-lg">
        <button
          onClick={() => updateQty(item.id, item.qty - 1)}
          className="w-8 h-8 rounded-md bg-dark-elevated text-[var(--text)] font-bold hover:bg-secondary hover:text-white transition-all"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-[28px] text-center font-semibold text-sm tabular-nums">
          {item.qty}
        </span>
        <button
          onClick={() => updateQty(item.id, item.qty + 1)}
          className="w-8 h-8 rounded-md bg-dark-elevated text-[var(--text)] font-bold hover:bg-secondary hover:text-white transition-all"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="col-start-2 row-start-2 sm:col-auto sm:row-auto justify-self-end sm:justify-self-auto font-extrabold text-sm sm:text-base text-secondary-light whitespace-nowrap">
        {formatINR((item.numericPrice || 0) * (item.qty || 0))}
      </div>
    </div>
  );
}