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
  bot.on('contact', handleContact);
  bot.on('text', handleFallback);

  bot.catch((err, ctx) => {
    console.error(`⚠️  Bot xatosi (${ctx.updateType}):`, err.message);
  });

  return bot;
}
