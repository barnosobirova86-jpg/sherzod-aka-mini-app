import adminBot from '../core/adminBot.js';
import config from '../config/default.js';
import User from '../models/User.js';
import { isAdminPhone } from '../controllers/botController.js';

const isHttps = (url) => typeof url === 'string' && url.startsWith('https://');

/**
 * Admin panelni ochadigan tugma
 */
function panelKeyboard() {
  if (!isHttps(config.adminPanelUrl)) return undefined;
  return {
    reply_markup: {
      keyboard: [[{ text: '⚙️ Admin panel', web_app: { url: config.adminPanelUrl } }]],
      resize_keyboard: true,
    },
  };
}

function phoneKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
}

export function registerAdminBotHandlers() {
  if (!adminBot) return null;

  adminBot.start(async (ctx) => {
    const user = await User.upsert({
      telegramId: ctx.from.id,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      username: ctx.from.username,
    });

    await ctx.replyWithHTML(
      '<b>ART-SHERZOD — boshqaruv paneli</b> ⚙️\n\n' +
        'Mahsulotlar va buyurtmalarni shu yerdan boshqarasiz.',
      panelKeyboard()
    );

    // Raqami avval saqlangan bo'lsa — darhol taniymiz
    if (user.phone && isAdminPhone(user.phone)) {
      if (!user.isAdmin) await User.setAdmin(user.id, true);
      return ctx.replyWithHTML('🔔 Yangi buyurtmalar haqida xabar shu yerga keladi.');
    }

    await ctx.reply(
      'Buyurtmalar haqida xabar olish uchun telefon raqamingizni yuboring:',
      phoneKeyboard()
    );
  });

  adminBot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    if (!contact) return;

    const user = await User.findByTelegramId(ctx.from.id);
    if (!user) return;

    await User.updatePhone(user.id, contact.phone_number);

    if (!isAdminPhone(contact.phone_number)) {
      return ctx.replyWithHTML(
        '⚠️ Bu raqam do‘kon egasi sifatida ro‘yxatda yo‘q.\n' +
          'Xarid qilish uchun do‘kon botidan foydalaning.'
      );
    }

    if (!user.isAdmin) await User.setAdmin(user.id, true);

    await ctx.replyWithHTML(
      '✅ <b>Tayyor!</b>\n\nEndi har bir yangi buyurtma shu yerga xabar bo‘lib keladi. 🔔',
      panelKeyboard() || {}
    );
  });

  adminBot.command('id', (ctx) =>
    ctx.replyWithHTML(`Telegram ID raqamingiz: <code>${ctx.chat.id}</code>`)
  );

  adminBot.catch((err, ctx) => {
    console.error(`⚠️  Admin bot xatosi (${ctx.updateType}):`, err.message);
  });

  return adminBot;
}
