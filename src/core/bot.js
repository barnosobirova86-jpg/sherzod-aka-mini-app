import { Telegraf } from 'telegraf';
import config from '../config/default.js';

const bot = new Telegraf(config.botToken);

/**
 * Foydalanuvchiga oddiy xabar yuborish
 */
export async function sendMessage(telegramId, text, extra = {}) {
  try {
    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML', ...extra });
    return true;
  } catch (error) {
    console.error(`⚠️  ${telegramId} ga xabar yuborilmadi:`, error.message);
    return false;
  }
}

export default bot;
