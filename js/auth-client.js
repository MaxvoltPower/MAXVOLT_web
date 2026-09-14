// ============================================
// MAXVOLT — Auth Client Helpers
// Waits for maxvoltAuth to be available before wiring up
// ============================================

(function () {
  const API_BASE = '';

  function whenAuthReady() {
    return new Promise((resolve) => {
      if (window.maxvoltAuth) return resolve();
      window.addEventListener('maxvolt-auth-ready', () => resolve(), { once: true });
      // Fallback poll in case event was missed
      const t = setInterval(() => {
        if (window.maxvoltAuth) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  }

  async function apiFetch(path, options = {}) {
    await whenAuthReady();
    const token = await window.maxvoltAuth.getIdToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data.data;
  }

  window.maxvoltApi = {
    verify: () => apiFetch('/api/auth/verify', { method: 'POST' }),
    getProfile: () => apiFetch('/api/auth/profile'),
    updateProfile: (payload) =>
      apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    getProducts: (qs = '') => apiFetch(`/api/products${qs}`),
    getProduct: (id) => apiFetch(`/api/products/${id}`),
    getOrders: () => apiFetch('/api/orders'),
    createOrder: (payload) =>
      apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
    createPayment: (payload) =>
      apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify(payload) }),
    verifyPayment: (payload) =>
      apiFetch('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),
    submitQuote: (payload) =>
      apiFetch('/api/quotes', { method: 'POST', body: JSON.stringify(payload) }),
    submitContact: (payload) =>
      apiFetch('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // Update header login/account links once auth state is known
  whenAuthReady().then(() => {
    window.maxvoltAuth.onAuthChange((user) => {
      const loginLink = document.getElementById('nav-login');
      const accountLink = document.getElementById('nav-account');
      if (!loginLink && !accountLink) return;
      if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (accountLink) accountLink.style.display = 'inline-flex';
      } else {
        if (loginLink) loginLink.style.display = 'inline-flex';
        if (accountLink) accountLink.style.display = 'none';
      }
    });
  });
})();