let razorpayLoaded = false;
let razorpayPromise = null;

export function loadRazorpay() {
  if (razorpayLoaded && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayLoaded = true;
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      razorpayPromise = null;
      reject(new Error('Failed to load Razorpay SDK'));
    };
    document.body.appendChild(script);
  });

  return razorpayPromise;
}