import { tg } from './telegram.js';

// Netlify‘da statik sayt sifatida joylashtirilganda, backend boshqa manzilda
// turadi — shu manzil deploy paytida VITE_API_URL orqali beriladi.
// Lokal kompyuterda (Vite dev server) bo‘sh qoldiriladi — proxy o‘zi ishlaydi.
const API_ROOT = import.meta.env.VITE_API_URL || '';
const BASE = `${API_ROOT}/api`;

/**
 * "/uploads/rasm.jpg" kabi nisbiy rasm manzilini to‘liq (backend) manzilga aylantiradi.
 */
export function resolveImage(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ROOT}${url}`;
}

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
  updateProfile: (payload) =>
    request('/profile', { method: 'POST', body: JSON.stringify(payload) }),
  myOrders: () => request('/orders'),
  createOrder: (payload) =>
    request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
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
