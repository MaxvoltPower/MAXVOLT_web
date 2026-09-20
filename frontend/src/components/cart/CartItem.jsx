import { useCart } from '@context/CartContext';
import { resolveProductImage, formatPrice } from '@lib/utils';

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useCart();
  const imageSrc = item.image ? resolveProductImage({ image: item.image }) : null;

  return (
    <div className="grid grid-cols-[80px_1fr_auto_auto] sm:grid-cols-[80px_1fr_auto_auto] gap-4 items-center p-4 bg-dark-elevated border border-dark-border rounded-2xl mb-3">
      <div className="w-20 h-20 rounded-lg bg-dark-muted grid place-items-center overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={item.model} className="w-full h-full object-contain p-2" />
        ) : (
          <span className="text-3xl">🔋</span>
        )}
      </div>

      <div className="min-w-0">
        <h4 className="font-bold text-sm mb-1 truncate">
          {item.brand} {item.model}
        </h4>
        <p className="text-xs text-[var(--text-subtle)]">{item.capacity}</p>
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-xs text-red-400 hover:underline mt-1"
        >
          Remove
        </button>
      </div>

      <div className="inline-flex items-center gap-2 bg-dark-muted p-1 rounded-lg">
        <button
          onClick={() => updateQty(item.id, item.qty - 1)}
          className="w-7 h-7 rounded-md bg-dark-elevated text-[var(--text)] font-bold hover:bg-secondary hover:text-white transition-all"
        >
          −
        </button>
        <span className="min-w-[24px] text-center font-semibold text-sm">{item.qty}</span>
        <button
          onClick={() => updateQty(item.id, item.qty + 1)}
          className="w-7 h-7 rounded-md bg-dark-elevated text-[var(--text)] font-bold hover:bg-secondary hover:text-white transition-all"
        >
          +
        </button>
      </div>

      <div className="font-extrabold text-base text-secondary-light whitespace-nowrap">
        {formatPrice(item.numericPrice * item.qty)}
      </div>
    </div>
  );
}