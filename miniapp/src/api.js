import { tg } from './telegram.js';

const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': tg?.initData || '',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return response.json();
}

export const api = {
  products: (category) =>
    request(`/products${category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''}`),
  categories: () => request('/categories'),
  recommended: () => request('/recommended'),
  me: () => request('/me'),
  myOrders: () => request('/orders'),
  createOrder: (payload) =>
    request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
};

/* ---------- Ichki admin panel uchun ---------- */

const ADMIN_BASE = '/api/admin';

async function adminRequest(password, path, options = {}) {
  const response = await fetch(ADMIN_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return response.json();
}

export const adminApi = {
  login: (password) =>
    fetch(ADMIN_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(async (r) => {
      if (!r.ok) throw new Error("Parol noto'g'ri");
      return r.json();
    }),

  stats: (p) => adminRequest(p, '/stats'),
  orders: (p) => adminRequest(p, '/orders'),
  updateOrderStatus: (p, id, status) =>
    adminRequest(p, `/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  products: (p) => adminRequest(p, '/products'),
  createProduct: (p, data) =>
    adminRequest(p, '/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (p, id, data) =>
    adminRequest(p, `/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (p, id) => adminRequest(p, `/products/${id}`, { method: 'DELETE' }),

  uploads: (p) => adminRequest(p, '/uploads'),
  uploadImage: (p, file) => {
    const body = new FormData();
    body.append('image', file);
    return fetch(ADMIN_BASE + '/upload', {
      method: 'POST',
      headers: { 'x-admin-password': p },
      body,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Rasm yuklanmadi');
      return data;
    });
  },
};

export const formatPrice = (value) => Number(value || 0).toLocaleString('uz-UZ');
