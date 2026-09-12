// Netlify'ga joylashtirilganda backend boshqa manzilda turadi.
// Deploy paytida VITE_API_URL environment o'zgaruvchisi orqali beriladi.
const API_ROOT = import.meta.env.VITE_API_URL || '';
const BASE = `${API_ROOT}/api/admin`;
const TOKEN_KEY = 'kisva_admin_token';

/**
 * "/uploads/rasm.jpg" kabi nisbiy rasm manzilini to'liq (backend) manzilga aylantiradi.
 */
export function resolveImage(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ROOT}${url}`;
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Yangi buyurtmalarni jonli kuzatish uchun manzil (EventSource maxsus
 * header yubora olmagani uchun parol query orqali beriladi).
 */
export function eventsUrl() {
  return `${BASE}/events?password=${encodeURIComponent(getToken())}`;
}

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': getToken(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearToken();
    throw new Error("Сессия тугади. Қайтадан киринг.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Хатолик юз берди');
  }

  return response.json();
}

export const api = {
  login: (password) =>
    fetch(BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(async (r) => {
      if (!r.ok) throw new Error("Парол нотўғри");
      return r.json();
    }),

  stats: () => request('/stats'),

  orders: (status) => request(`/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  uploads: () => request('/uploads'),

  uploadImage: (file) => {
    const body = new FormData();
    body.append('image', file);
    return fetch(BASE + '/upload', {
      method: 'POST',
      headers: { 'x-admin-password': getToken() },
      body,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Расм юкланмади');
      return data;
    });
  },

  products: () => request('/products'),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const formatPrice = (value) => Number(value || 0).toLocaleString('uz-UZ');

export const formatDate = (value) =>
  new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
