// ============================================
// MAXVOLT — Razorpay Checkout Helper
// Usage:
//   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
//   <script type="module" src="/js/firebase-client.js"></script>
//   <script src="/js/auth-client.js"></script>
//   <script src="/js/checkout.js"></script>
//   ...
//   <button onclick="startCheckout({items, shipping, total})">Buy Now</button>
// ============================================

window.startCheckout = async function ({ items, shipping, total }) {
  try {
    if (!window.maxvoltAuth || !window.maxvoltAuth.auth.currentUser) {
      alert('Please login to continue');
      window.location.href = '/account/login.html';
      return;
    }

    const user = window.maxvoltAuth.auth.currentUser;

    // 1. Create payment order on server
    const payData = await window.maxvoltApi.createPayment({ amount: total, items, shipping });

    // 2. Open Razorpay checkout
    const options = {
      key: payData.keyId,
      amount: payData.amount,
      currency: payData.currency,
      name: 'MAXVOLT',
      description: 'Battery & Power Solutions',
      order_id: payData.razorpayOrderId,
      prefill: {
        name: user.displayName || '',
        email: user.email || '',
        contact: shipping?.phone || '',
      },
      theme: { color: '#ff6b00' },
      handler: async function (response) {
        try {
          await window.maxvoltApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: payData.orderId,
          });
          alert('Payment successful! Order confirmed.');
          window.location.href = '/account/orders.html';
        } catch (err) {
          alert('Payment verification failed: ' + err.message);
        }
      },
      modal: {
        ondismiss: () => console.log('Payment cancelled'),
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert('Checkout failed: ' + err.message);
  }
};

// Example usage (uncomment in a page where you have a Buy Now button):
//
// <button class="btn btn-primary" onclick="startCheckout({
//   items: [{ productId: 'BAT-LUM-002', model: 'RC18000 PRO', qty: 1, price: 12500 }],
//   shipping: { name: 'John Doe', phone: '9876543210', address: 'Kolkata' },
//   total: 12500
// })">Buy Now</button>