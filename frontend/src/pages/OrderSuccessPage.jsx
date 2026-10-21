// ============================================================
// MAXVOLT — Order success page
// ============================================================

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@lib/api';
import { useAuth } from '@context/AuthContext';
import { formatPrice, openWhatsapp } from '@lib/utils';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const method = searchParams.get('method');
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId || !user) return;
    api
      .getOrder(orderId)
      .then((data) => setOrder(data))
      .catch((err) => console.warn('Could not load order:', err.message));
  }, [orderId, user]);

  const shortId = orderId ? `#${String(orderId).slice(-8).toUpperCase()}` : '';
  const isPaid = order?.paymentStatus === 'paid';
  const isFailed = order?.paymentStatus === 'failed';
  const isPending = order && !isPaid && !isFailed;

  // Headline depends on actual payment status (once loaded)
  let headline = 'Order Confirmed!';
  let headlineColor = 'text-emerald-400';
  let subline =
    "Thank you for your order. We'll contact you shortly to confirm delivery details.";
  let icon = '✓';
  let iconBg = 'bg-emerald-500/15 border-emerald-500/30';

  if (isFailed) {
    headline = 'Payment Failed';
    headlineColor = 'text-red-400';
    subline =
      'Your payment did not go through. You can retry from your orders page, or contact us for help.';
    icon = '✕';
    iconBg = 'bg-red-500/15 border-red-500/30';
  } else if (isPending && method === 'razorpay') {
    headline = 'Payment Pending';
    headlineColor = 'text-amber-400';
    subline =
      'We have not received a payment confirmation yet. If you have paid, please wait a minute and refresh — the confirmation can take a moment to arrive.';
    icon = '⏳';
    iconBg = 'bg-amber-500/15 border-amber-500/30';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 text-center">
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 grid place-items-center rounded-full border-2 text-4xl sm:text-5xl ${iconBg}`}
      >
        {icon}
      </div>

      <h1 className={`mb-3 text-2xl sm:text-3xl ${headlineColor}`}>{headline}</h1>
      <p className="text-base sm:text-lg mb-6 text-[var(--text-muted)]">
        {subline}
      </p>

      <div className="surface text-left mb-6">
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Order ID</span>
          <span className="font-semibold">{shortId || '—'}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Payment Method</span>
          <span className="font-semibold">
            {method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}
          </span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Payment Status</span>
          <span
            className={`font-semibold ${
              isPaid ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {order?.paymentStatus || 'pending'}
          </span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-dark-border text-sm">
          <span className="text-[var(--text-subtle)]">Order Status</span>
          <span className="font-semibold">{order?.status || 'placed'}</span>
        </div>
        {order?.total && (
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-[var(--text-subtle)]">Total</span>
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {user && (
          <Link
            to="/account/orders"
            className="inline-flex px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:-translate-y-0.5 transition-all text-sm sm:text-base"
          >
            View My Orders
          </Link>
        )}
        <Link
          to="/products"
          className="inline-flex px-5 sm:px-6 py-3 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted hover:border-accent transition-all text-sm sm:text-base"
        >
          Continue Shopping
        </Link>
        <button
          onClick={() =>
            openWhatsapp(
              `Hi MAXVOLT, I need help with order ${shortId}. Payment status shows: ${
                order?.paymentStatus || 'pending'
              }.`
            )
          }
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white font-semibold hover:-translate-y-0.5 transition-all text-sm sm:text-base"
        >
          💬 Contact on WhatsApp
        </button>
      </div>
    </div>
  );
}