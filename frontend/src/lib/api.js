// ============================================================
// MAXVOLT — API client
// ============================================================

import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function getToken() {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Core request wrapper.
 * Returns `data.data` (never `undefined` — falls back to `null`).
 * Throws on non-2xx or `success === false`.
 */
async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = {}; }
  }

  if (!res.ok || data.success === false) {
    const message =
      data.error ||
      (res.status === 401
        ? 'Please sign in to continue.'
        : res.status === 403
        ? 'You do not have permission to do that.'
        : `Request failed (${res.status})`);
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  // Preserve null (some callers rely on it) — never return a bare `undefined`
  if (data.data === undefined) return null;
  return data.data;
}

export const api = {
  // ---- Auth ----
  verify: () => request('/api/auth/verify', { method: 'POST' }),
  getProfile: () => request('/api/auth/profile'),
  updateProfile: (payload) =>
    request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // ---- Products ----
  getProducts: (qs = '') => request(`/api/products${qs}`),
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (payload) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),

  // ---- Orders ----
  getOrders: () => request('/api/orders'),
  createOrder: (payload) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrder: (id) => request(`/api/orders/${id}`),
  updateOrder: (id, payload) =>
    request(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // ---- Payments ----
  createPayment: (payload) =>
    request('/api/payments/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) =>
    request('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),

  // ---- Quotes ----
  submitQuote: (payload) =>
    request('/api/quotes', { method: 'POST', body: JSON.stringify(payload) }),
  getQuotes: () => request('/api/quotes'),
  updateQuote: (id, payload) =>
    request(`/api/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteQuote: (id) => request(`/api/quotes/${id}`, { method: 'DELETE' }),

  // ---- Sections ----
  getSections: () => request('/api/sections'),
  createSection: (payload) =>
    request('/api/sections', { method: 'POST', body: JSON.stringify(payload) }),
  updateSection: (id, payload) =>
    request(`/api/sections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSection: (id) => request(`/api/sections/${id}`, { method: 'DELETE' }),

  // ---- Admin ----
  getAdminStats: () => request('/api/admin/stats'),
  getUsers: (q) => request(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  setUserRole: (uid, role) =>
    request('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ uid, role }) }),
  getSettings: () => request('/api/admin/settings'),
  saveSettings: (payload) =>
    request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  // ---- Chat ----
  chat: (payload) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify(payload) }),

  // ---- Contact ----
  submitContact: (payload) =>
    request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),

  // ---- Utils ----
  getToken,
};