import crypto from 'crypto';
import config from '../config/default.js';
import User from '../models/User.js';

/**
 * Telegram initData ni imzo (hash) bo'yicha tekshirish
 */
function verifyInitData(initData, botToken) {
  try {
    console.log('[DEBUG auth] XOM initData HEX:', Buffer.from(initData, 'utf8').toString('hex'));
    const params = new URLSearchParams(initData);
    console.log('[DEBUG auth] Barcha maydonlar:', [...params.keys()].join(', '));
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
      // Muqobil 1: '\/' ni '/' ga almashtirib ko'ramiz
      const altString = dataCheckString.replace(/\\\//g, '/');
      const altHash = crypto.createHmac('sha256', secretKey).update(altString).digest('hex');

      // Muqobil 2: Login Widget uslubi (secret = SHA256(token), HMAC emas)
      const loginSecret = crypto.createHash('sha256').update(botToken).digest();
      const loginHash = crypto.createHmac('sha256', loginSecret).update(dataCheckString).digest('hex');

      // Muqobil 3: token trim qilingan holda (bo'sh joy bo'lsa)
      const trimmedKey = crypto.createHmac('sha256', 'WebAppData').update(botToken.trim()).digest();
      const trimmedHash = crypto.createHmac('sha256', trimmedKey).update(dataCheckString).digest('hex');

      console.log('[DEBUG auth] hisoblangan (standart):  ', calculatedHash);
      console.log('[DEBUG auth] muqobil (/ escapesiz):    ', altHash);
      console.log('[DEBUG auth] muqobil (login-widget):   ', loginHash);
      console.log('[DEBUG auth] muqobil (token.trim()):   ', trimmedHash);
      console.log('[DEBUG auth] kelgan hash:              ', hash);

      if (altHash === hash || loginHash === hash || trimmedHash === hash) {
        console.log('[DEBUG auth] MOS TOPILDI!');
        const userRaw = params.get('user');
        return userRaw ? JSON.parse(userRaw) : null;
      }

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
