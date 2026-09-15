import bot from '../core/bot.js';
import {
  handleStart,
  handleContact,
  handleMyOrders,
  handleHelp,
  handleFallback,
} from '../controllers/botController.js';

export function registerBotHandlers() {
  bot.start(handleStart);
  bot.help(handleHelp);
  bot.command('buyurtmalarim', handleMyOrders);

  // Do'kon egasi o'z Telegram raqamini bilishi uchun (xabar sozlashda kerak)
  bot.command('id', (ctx) =>
    ctx.replyWithHTML(`Sizning Telegram ID raqamingiz: <code>${ctx.chat.id}</code>`)
  );
  bot.on('contact', handleContact);
  bot.on('text', handleFallback);

  bot.catch((err, ctx) => {
    console.error(`⚠️  Bot xatosi (${ctx.updateType}):`, err.message);
  });

  return bot;
}
