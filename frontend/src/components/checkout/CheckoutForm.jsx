// ============================================================
// MAXVOLT — Checkout form
// ============================================================

import { useState, useRef } from 'react';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { api } from '@lib/api';
import { loadRazorpay } from '@lib/razorpay';
import { formatPrice } from '@lib/utils';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function CheckoutForm({ onSuccess }) {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState({
    name: profile?.displayName || user?.displayName || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || 'Kolkata',
    pincode: profile?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const { name, email, phone, address, city, pincode } = formData;
    if (!name || !email || !phone || !address || !city || !pincode) {
      return 'Please fill in all required fields.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Please enter a valid 10-digit phone number.';
    }
    if (!/^\d{6}$/.test(pincode)) {
      return 'Please enter a valid 6-digit PIN code.';
    }
    return '';
  };

  const buildItems = () =>
    cart.map((i) => ({
      productId: i.id,
      brand: i.brand,
      model: i.model,
      capacity: i.capacity,
      price: i.numericPrice,
      qty: i.qty,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    const items = buildItems();
    const total = getCartTotal();
    const shipping = { ...formData };

    try {
      if (paymentMethod === 'cod') {
        const result = await api.createOrder({
          items,
          shipping,
          total,
          paymentMethod: 'cod',
        });

        const orderId = result?._id || result?.id || null;
        if (!orderId) {
          throw new Error(
            'Order was created but no ID was returned. Please contact support.'
          );
        }

        clearCart();
        if (onSuccess) onSuccess({ orderId, method: 'cod' });
      } else {
        await loadRazorpay();
        const payData = await api.createPayment({ amount: total, items, shipping });

        if (!payData?.razorpayOrderId || !payData?.orderId) {
          throw new Error('Failed to create Razorpay order — invalid response.');
        }

        const options = {
          key: payData.keyId,
          amount: payData.amount,
          currency: payData.currency,
          name: 'MAXVOLT',
          description: 'Battery & Power Solutions',
          order_id: payData.razorpayOrderId,
          prefill: {
            name: shipping.name,
            email: shipping.email,
            contact: shipping.phone,
          },
          notes: { address: shipping.address },
          theme: { color: '#ff6b00' },
          handler: async function (response) {
            try {
              await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: payData.orderId,
              });
              clearCart();
              if (onSuccess)
                onSuccess({ orderId: payData.orderId, method: 'razorpay' });
            } catch (err) {
              setError('Payment verification failed: ' + err.message);
              setLoading(false);
              submittingRef.current = false;
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              submittingRef.current = false;
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on?.('payment.failed', function (resp) {
          setError(
            resp?.error?.description ||
              'Payment failed. Please try again or choose Cash on Delivery.'
          );
          setLoading(false);
          submittingRef.current = false;
        });
        rzp.open();
        // Don't reset loading here — handler/ondismiss will reset.
        return;
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    } finally {
      if (paymentMethod === 'cod') {
        submittingRef.current = false;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="surface">
        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">
          Contact Information
        </h3>
        <Input
          label="Full Name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="9876543210"
          autoComplete="tel"
        />
      </div>

      <div className="surface">
        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">
          Shipping Address
        </h3>
        <div className="form-group">
          <label className="block mb-2 font-semibold text-sm">
            Full Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            rows={3}
            autoComplete="street-address"
            placeholder="House/Flat, Street, Landmark"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            autoComplete="address-level2"
          />
          <Input
            label="PIN Code"
            name="pincode"
            required
            value={formData.pincode}
            onChange={handleChange}
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>
      </div>

      <div className="surface">
        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">
          Payment Method
        </h3>
        <div className="space-y-3">
          {[
            {
              id: 'razorpay',
              title: 'Pay Online (Razorpay)',
              desc: 'UPI, Card, Netbanking, Wallets',
              icon: '💳',
            },
            {
              id: 'cod',
              title: 'Cash on Delivery',
              desc: 'Pay when your order arrives',
              icon: '💵',
            },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                paymentMethod === opt.id
                  ? 'border-secondary bg-secondary/8'
                  : 'border-dark-border hover:border-secondary hover:bg-secondary/5'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={opt.id}
                checked={paymentMethod === opt.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-secondary shrink-0 w-4 h-4"
              />
              <span className="text-xl shrink-0">{opt.icon}</span>
              <div className="min-w-0">
                <strong className="text-sm sm:text-base">{opt.title}</strong>
                <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                  {opt.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full py-3.5 sm:py-4"
        loading={loading}
      >
        Place Order — {formatPrice(getCartTotal())}
      </Button>

      <p className="text-center text-xs text-[var(--text-subtle)]">
        By placing your order, you agree to our{' '}
        <a href="/terms-conditions" className="text-accent hover:underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="/privacy-policy" className="text-accent hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}