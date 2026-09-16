// Admin API wrapper — reads token from window.maxvoltAuth
(function () {
  function waitForAuth(cb) {
    if (window.maxvoltAuth) return cb();
    const t = setInterval(() => {
      if (window.maxvoltAuth) { clearInterval(t); cb(); }
    }, 50);
  }

  async function adminFetch(path, options = {}) {
    const token = await new Promise((resolve) => {
      waitForAuth(async () => {
        resolve(await window.maxvoltAuth.getIdToken());
      });
    });

    if (!token) throw new Error('Not authenticated');

    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data.data;
  }

  window.adminApi = {
    stats: () => adminFetch('/api/admin/stats'),
    users: (q) => adminFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    setRole: (uid, role) => adminFetch('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ uid, role }) }),
    settings: () => adminFetch('/api/admin/settings'),
    saveSettings: (payload) => adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),

    products: (qs = '') => adminFetch(`/api/products${qs}`),
    getProduct: (id) => adminFetch(`/api/products/${id}`),
    createProduct: (p) => adminFetch('/api/products', { method: 'POST', body: JSON.stringify(p) }),
    updateProduct: (id, p) => adminFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    deleteProduct: (id) => adminFetch(`/api/products/${id}`, { method: 'DELETE' }),

    orders: () => adminFetch('/api/orders?all=1'),
    updateOrder: (id, payload) => adminFetch(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    quotes: () => adminFetch('/api/quotes'),
    updateQuote: (id, payload) => adminFetch(`/api/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteQuote: (id) => adminFetch(`/api/quotes/${id}`, { method: 'DELETE' }),
  };
})();