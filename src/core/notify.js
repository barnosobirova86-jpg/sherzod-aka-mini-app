import config from '../config/default.js';
import { sendMessage } from './bot.js';
import { orderTotalLabel } from '../controllers/botController.js';

/*
 * Yangi buyurtma kelganda do'kon egasiga xabar berish.
 *
 * Ikki yo'l bilan yuboriladi:
 *   1. Telegram  — bepul va bir zumda (ADMIN_CHAT_IDS berilsa)
 *   2. SMS       — Eskiz.uz orqali (ESKIZ_EMAIL + ESKIZ_PASSWORD berilsa)
 *
 * Sozlanmagani o'tkazib yuboriladi, buyurtmaga xalal bermaydi.
 */

const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL || '';
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD || '';
const ESKIZ_FROM = process.env.ESKIZ_FROM || '4546';
const ESKIZ_API = 'https://notify.eskiz.uz/api';

export const smsEnabled = Boolean(ESKIZ_EMAIL && ESKIZ_PASSWORD);

/* Eskiz tokeni 30 kun yashaydi — qayta-qayta so'ramaymiz */
let cachedToken = null;
let tokenTime = 0;

async function eskizToken() {
  if (cachedToken && Date.now() - tokenTime < 24 * 60 * 60 * 1000) return cachedToken;

  const body = new FormData();
  body.append('email', ESKIZ_EMAIL);
  body.append('password', ESKIZ_PASSWORD);

  const response = await fetch(`${ESKIZ_API}/auth/login`, { method: 'POST', body });
  if (!response.ok) throw new Error(`Eskiz login ${response.status}`);

  const data = await response.json();
  cachedToken = data?.data?.token;
  tokenTime = Date.now();

  if (!cachedToken) throw new Error('Eskiz tokeni olinmadi');
  return cachedToken;
}

/**
 * Bitta raqamga SMS yuborish. Raqam 998XXXXXXXXX ko'rinishiga keltiriladi.
 */
async function sendSms(phone, text) {
  const mobile = String(phone).replace(/\D/g, '');
  if (mobile.length < 9) return false;

  try {
    const token = await eskizToken();

    const body = new FormData();
    body.append('mobile_phone', mobile);
    body.append('message', text);
    body.append('from', ESKIZ_FROM);

    const response = await fetch(`${ESKIZ_API}/message/sms/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    if (!response.ok) throw new Error(`Eskiz ${response.status}: ${await response.text()}`);

    console.log(`📨 SMS yuborildi: ${mobile}`);
    return true;
  } catch (error) {
    console.error(`⚠️  SMS yuborilmadi (${mobile}):`, error.message);
    return false;
  }
}

/**
 * Buyurtma haqida do'kon egasiga to'liq xabar (Telegram uchun)
 */
function adminMessage(order) {
  const items = (order.items || [])
    .map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
    .join('\n');

  return (
    `🔔 <b>Yangi buyurtma #${order.id}</b>\n\n` +
    `${items}\n\n` +
    `💰 Jami: <b>${orderTotalLabel(order)}</b>\n` +
    (order.customerName ? `👤 ${order.customerName}\n` : '') +
    (order.phone ? `📞 ${order.phone}\n` : '') +
    (order.address ? `🏠 ${order.address}\n` : '') +
    (order.note ? `📝 ${order.note}` : '')
  );
}

/**
 * SMS qisqa bo'lishi kerak — uzun matn bir nechta SMS'ga bo'linib ketadi
 */
function smsText(order) {
  const phone = order.phone ? ` Tel: ${order.phone}.` : '';
  return `ART-SHERZOD: yangi buyurtma #${order.id}, ${orderTotalLabel(order)}.${phone} Admin panelni oching.`;
}

/**
 * Yangi buyurtma haqida barcha adminlarga xabar beradi.
 * Xatolar yutiladi — mijozning buyurtmasi baribir qabul qilinadi.
 */
export async function notifyAdmins(order) {
  const tasks = [];

  for (const chatId of config.adminChatIds) {
    tasks.push(sendMessage(chatId, adminMessage(order)));
  }

  if (smsEnabled) {
    for (const phone of config.adminPhones) {
      tasks.push(sendSms(phone, smsText(order)));
    }
  }

  if (!tasks.length) return;

  await Promise.allSettled(tasks);
}
