import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@lib/api';
import { formatPrice, openWhatsapp } from '@lib/utils';
import Button from '@components/ui/Button';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const method = searchParams.get('method');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    api
      .getOrder(orderId)
      .then((data) => setOrder(data))
      .catch((err) => console.warn(err));
  }, [orderId]);

  const shortId = orderId ? `#${String(orderId).slice(-8).toUpperCase()}` : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 mx-auto mb-6 grid place-items-center bg-emerald-500/15 rounded-full border-2 border-emerald-500/30 text-5xl">
        ✓
      </div>

      <h1 className="text-emerald-400 mb-3">Order Confirmed!</h1>
      <p className="text-lg mb-6">
        Thank you for your order. We'll contact you shortly to confirm delivery details.
      </p>

      <div className="surface text-left mb-6">
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Order ID</span>
          <span className="font-semibold">{shortId || '—'}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Payment Method</span>
          <span className="font-semibold">
            {method === 'cod' ? 'Cash on Delivery' : 'Paid Online (Razorpay)'}
          </span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Status</span>
          <span className="badge badge-placed">{order?.status || 'placed'}</span>
        </div>
        {order?.total && (
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-[var(--text-subtle)]">Total</span>
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/account/orders"
          className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:-translate-y-0.5 transition-all"
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          className="inline-flex px-6 py-3 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted hover:border-accent transition-all"
        >
          Continue Shopping
        </Link>
        <button
          onClick={() =>
            openWhatsapp(
              `Hi MAXVOLT, I just placed order ${shortId}. Please confirm.`
            )
          }
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white font-semibold hover:-translate-y-0.5 transition-all"
        >
          💬 Contact on WhatsApp
        </button>
      </div>
    </div>
  );
}