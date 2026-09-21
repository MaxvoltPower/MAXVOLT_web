import { useState } from 'react';
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
    if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) {
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
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

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

        // Defensive: order ID might be missing if the API response was malformed
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
            }
          },
          modal: {
            ondismiss: () => setLoading(false),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
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
        <h3 className="text-lg font-bold mb-5">Contact Information</h3>
        <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} />
        <Input label="Email" name="email" type="email" required value={formData.email} onChange={handleChange} />
        <Input label="Phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="9876543210" />
      </div>

      <div className="surface">
        <h3 className="text-lg font-bold mb-5">Shipping Address</h3>
        <div className="form-group">
          <label className="block mb-2 font-semibold text-sm">
            Full Address <span className="text-red-400">*</span>
          </label>
          <textarea name="address" required value={formData.address} onChange={handleChange} rows={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="City" name="city" required value={formData.city} onChange={handleChange} />
          <Input label="PIN Code" name="pincode" required value={formData.pincode} onChange={handleChange} maxLength={6} />
        </div>
      </div>

      <div className="surface">
        <h3 className="text-lg font-bold mb-5">Payment Method</h3>
        <div className="space-y-3">
          {[
            { id: 'razorpay', title: 'Pay Online (Razorpay)', desc: 'UPI, Card, Netbanking, Wallets' },
            { id: 'cod', title: 'Cash on Delivery', desc: 'Pay when your order arrives' },
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
                className="accent-secondary"
              />
              <div>
                <strong>{opt.title}</strong>
                <p className="text-xs text-[var(--text-subtle)] mt-1">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full py-3.5" loading={loading}>
        Place Order — {formatPrice(getCartTotal())}
      </Button>
    </form>
  );
}