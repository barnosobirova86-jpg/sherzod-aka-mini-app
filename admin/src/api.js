// Netlify‘ga joylashtirilganda backend boshqa manzilda turadi.
// Deploy paytida VITE_API_URL environment o‘zgaruvchisi orqali beriladi.
const API_ROOT = import.meta.env.VITE_API_URL || '';
const BASE = `${API_ROOT}/api/admin`;

/**
 * "/uploads/rasm.jpg" kabi nisbiy rasm manzilini to‘liq (backend) manzilga aylantiradi.
 */
export function resolveImage(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ROOT}${url}`;
}

/**
 * Yangi buyurtmalarni jonli kuzatish uchun manzil.
 */
export function eventsUrl() {
  return `${BASE}/events`;
}

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
      body,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Rasm yuklanmadi');
      return data;
    });
  },

  videoUploads: () => request('/video-uploads'),

  uploadVideo: (file) => {
    const body = new FormData();
    body.append('video', file);
    return fetch(BASE + '/upload-video', {
      method: 'POST',
      body,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Video yuklanmadi');
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

/**
 * Narxni mahsulot valyutasiga mos holda formatlaydi:
 * UZS -> "1 234 so‘m", USD -> "$1,234"
 */
export const formatMoney = (value, currency = 'UZS') =>
  currency === 'USD'
    ? `$${Number(value || 0).toLocaleString('en-US')}`
    : `${formatPrice(value)} so‘m`;

export const formatDate = (value) =>
  new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
