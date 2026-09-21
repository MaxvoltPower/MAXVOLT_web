import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function getToken() {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  // Always return an object (never undefined) so callers can safely destructure
  if (data.data === undefined || data.data === null) {
    return {};
  }
  return data.data;
}

export const api = {
  // Auth
  verify: () => request('/api/auth/verify', { method: 'POST' }),
  getProfile: () => request('/api/auth/profile'),
  updateProfile: (payload) =>
    request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Products
  getProducts: (qs = '') => request(`/api/products${qs}`),
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (payload) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) =>
    request(`/api/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request('/api/orders'),
  createOrder: (payload) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrder: (id) => request(`/api/orders/${id}`),
  updateOrder: (id, payload) =>
    request(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Payments
  createPayment: (payload) =>
    request('/api/payments/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) =>
    request('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),

  // Quotes
  submitQuote: (payload) =>
    request('/api/quotes', { method: 'POST', body: JSON.stringify(payload) }),
  getQuotes: () => request('/api/quotes'),
  updateQuote: (id, payload) =>
    request(`/api/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteQuote: (id) =>
    request(`/api/quotes/${id}`, { method: 'DELETE' }),

  // Sections
  getSections: () => request('/api/sections'),

  // Admin
  getAdminStats: () => request('/api/admin/stats'),
  getUsers: (q) => request(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  setUserRole: (uid, role) =>
    request('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ uid, role }) }),
  getSettings: () => request('/api/admin/settings'),
  saveSettings: (payload) =>
    request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  // Chat
  chat: (payload) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify(payload) }),

  // Contact
  submitContact: (payload) =>
    request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),

  // Expose token for direct fetch calls
  getToken,
};