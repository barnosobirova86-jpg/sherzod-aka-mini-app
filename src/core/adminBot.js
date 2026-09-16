import { Telegraf } from 'telegraf';

/*
 * Do'kon egalari uchun alohida bot (@sherzodadminpanelbot).
 * Ikki vazifasi bor:
 *   1. Admin panelni ochadigan tugma
 *   2. Yangi buyurtma haqida xabar yuborish
 *
 * ADMIN_BOT_TOKEN berilmasa — bot umuman ishga tushmaydi va
 * xabarlar eski yo'l bilan (do'kon boti orqali) yuboriladi.
 */

const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN || '';

export const adminBotEnabled = Boolean(ADMIN_BOT_TOKEN);

const adminBot = adminBotEnabled ? new Telegraf(ADMIN_BOT_TOKEN) : null;

/**
 * Do'kon egasiga admin boti orqali xabar yuborish
 */
export async function sendAdminMessage(telegramId, text, extra = {}) {
  if (!adminBot) return false;

  try {
    await adminBot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML', ...extra });
    return true;
  } catch (error) {
    console.error(`⚠️  Admin botdan ${telegramId} ga xabar yuborilmadi:`, error.message);
    return false;
  }
}

export default adminBot;
