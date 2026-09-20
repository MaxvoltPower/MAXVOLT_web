import { useCart } from '@context/CartContext';
import { formatPrice, resolveProductImage } from '@lib/utils';

export default function OrderSummary() {
  const { cart, getCartTotal, getCartCount } = useCart();

  return (
    <div className="surface sticky top-24">
      <h3 className="text-lg font-bold mb-5">Order Summary</h3>

      <div className="space-y-2 mb-5 max-h-72 overflow-y-auto pr-1">
        {cart.map((item) => {
          const imageSrc = item.image ? resolveProductImage({ image: item.image }) : null;
          return (
            <div
              key={item.id}
              className="grid grid-cols-[48px_1fr_auto] gap-3 items-center py-2.5 border-b border-dark-border last:border-b-0"
            >
              <div className="w-12 h-12 rounded-md bg-dark-muted grid place-items-center overflow-hidden">
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span>🔋</span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">
                  {item.brand} {item.model}
                </h4>
                <p className="text-[0.7rem] text-[var(--text-subtle)]">Qty: {item.qty}</p>
              </div>
              <div className="text-sm font-bold whitespace-nowrap">
                {formatPrice(item.numericPrice * item.qty)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 mt-4 border-t-2 border-dark-border space-y-2.5">
        <div className="flex justify-between text-sm">
          <span>Items ({getCartCount()})</span>
          <span className="font-semibold">{formatPrice(getCartTotal())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span className="text-[var(--text-subtle)]">Free</span>
        </div>
        <div className="flex justify-between pt-3 mt-3 border-t border-dark-border text-xl font-extrabold">
          <span>Total</span>
          <span className="text-secondary-light">{formatPrice(getCartTotal())}</span>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-subtle)] mt-4">
        Inclusive of GST. Final price confirmed at checkout.
      </p>
    </div>
  );
}