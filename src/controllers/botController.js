import config from '../config/default.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

const isHttps = (url) => typeof url === 'string' && url.startsWith('https://');

/**
 * Mini App'ni ochadigan klaviatura
 */
function shopKeyboard() {
  if (!isHttps(config.webAppUrl)) return undefined;
  return {
    reply_markup: {
      keyboard: [[{ text: '🛍 Дўконни очиш', web_app: { url: config.webAppUrl } }]],
      resize_keyboard: true,
    },
  };
}

/**
 * Telefon raqam so'rash klaviaturasi
 */
function phoneKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: '📱 Рақамни юбориш', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
}

export async function handleStart(ctx) {
  const from = ctx.from;
  const user = await User.upsert({
    telegramId: from.id,
    firstName: from.first_name,
    lastName: from.last_name,
    username: from.username,
  });

  await ctx.replyWithHTML(config.texts.start(from.first_name), shopKeyboard());

  if (!isHttps(config.webAppUrl)) {
    await ctx.replyWithHTML(
      "⚠️ <b>Diqqat (faqat dasturchi uchun):</b>\n" +
        "Mini App tugmasi ko'rinmayapti, chunki <code>WEBAPP_URL</code> hali HTTPS emas.\n" +
        "ngrok'ni ishga tushiring va <code>.env</code> faylidagi <code>WEBAPP_URL</code> ni yangilang."
    );
  }

  if (!user.phone) {
    await ctx.reply(
      'Буюртмаларингизни тезроқ расмийлаштириш учун телефон рақамингизни юборинг:',
      phoneKeyboard()
    );
  }
}

export async function handleContact(ctx) {
  const contact = ctx.message.contact;
  if (!contact) return;

  const user = await User.findByTelegramId(ctx.from.id);
  if (user) {
    await User.updatePhone(user.id, contact.phone_number);
  }

  await ctx.reply('✅ Раҳмат! Рақамингиз сақланди.', shopKeyboard() || {});
}

export async function handleMyOrders(ctx) {
  const user = await User.findByTelegramId(ctx.from.id);
  if (!user) return ctx.reply('Аввал /start буйруғини босинг.');

  const orders = await Order.findByUserId(user.id);
  if (!orders.length) {
    return ctx.reply('Сизда ҳали буюртмалар йўқ 🛒');
  }

  const lines = orders.slice(0, 5).map((order) => {
    const date = new Date(order.createdAt).toLocaleDateString('uz-UZ');
    const items = (order.items || []).map((i) => `• ${i.name} × ${i.qty}`).join('\n');
    const status = order.status === 'delivered' ? '✅ Етказилди' : '⏳ Кутилмоқда';
    return `<b>#${order.id}</b> — ${date}\n${items}\n💰 ${order.totalPrice.toLocaleString('uz-UZ')} сўм\n${status}`;
  });

  await ctx.replyWithHTML(`📜 <b>Буюртмаларингиз</b>\n\n${lines.join('\n\n')}`);
}

export async function handleHelp(ctx) {
  await ctx.replyWithHTML(config.texts.help, shopKeyboard() || {});
}

export async function handleFallback(ctx) {
  await ctx.replyWithHTML(config.texts.help, shopKeyboard() || {});
}

/**
 * Buyurtma qabul qilinganda mijozga yuboriladigan xabar
 */
export function buildOrderMessage(order) {
  const items = (order.items || [])
    .map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
    .join('\n');

  return (
    `${config.texts.orderAccepted}\n\n` +
    `<b>Буюртма #${order.id}</b>\n` +
    `${items}\n\n` +
    `💰 Жами: <b>${order.totalPrice.toLocaleString('uz-UZ')} сўм</b>`
  );
}
