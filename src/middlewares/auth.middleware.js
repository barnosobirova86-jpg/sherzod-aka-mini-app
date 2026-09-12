import crypto from 'crypto';
import config from '../config/default.js';
import User from '../models/User.js';

/**
 * Telegram initData ni imzo (hash) bo'yicha tekshirish
 */
function verifyInitData(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    params.delete('signature');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      console.log('[DEBUG auth] TO\'LIQ dataCheckString:', JSON.stringify(dataCheckString));
      console.log('[DEBUG auth] hisoblangan hash:', calculatedHash);
      console.log('[DEBUG auth] kelgan hash:      ', hash);
      return null;
    }

    const userRaw = params.get('user');
    return userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    console.log('[DEBUG auth] verifyInitData exception:', e.message);
    return null;
  }
}

/**
 * Mini App so'rovlarini himoyalash.
 * Header: x-telegram-init-data
 */
export async function telegramAuth(req, res, next) {
  try {
    const initData = req.header('x-telegram-init-data');
    let tgUser = null;

    if (initData) {
      tgUser = verifyInitData(initData, config.botToken);
      if (!tgUser) {
        console.log('[DEBUG auth] initData bor lekin tekshiruvdan o\'tmadi. Uzunlik:', initData.length);
        console.log('[DEBUG auth] initData namunasi:', initData.slice(0, 120));
        console.log('[DEBUG auth] BOT_TOKEN mavjudmi:', Boolean(config.botToken), 'uzunligi:', config.botToken?.length);
      }
    } else {
      console.log('[DEBUG auth] x-telegram-init-data header umuman kelmadi. Yo\'l:', req.path);
    }

    // Brauzerda (Telegramsiz) test qilish uchun
    if (!tgUser && config.allowDevAuth) {
      tgUser = {
        id: 999000111,
        first_name: 'Test',
        last_name: 'Mijoz',
        username: 'test_mijoz',
      };
    }

    if (!tgUser) {
      return res.status(401).json({ message: 'Avtorizatsiya xatosi. Ilovani Telegram orqali oching.' });
    }

    req.user = await User.upsert({
      telegramId: tgUser.id,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
    });

    next();
  } catch (error) {
    console.error('telegramAuth xatosi:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
}

/**
 * Admin panel so'rovlarini himoyalash.
 * Header: x-admin-password
 */
export function adminAuth(req, res, next) {
  const password = req.header('x-admin-password');
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ message: "Parol noto'g'ri" });
  }
  next();
}
