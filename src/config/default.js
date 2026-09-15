import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: Number(process.env.PORT) || 5000,
  botToken: process.env.BOT_TOKEN,
  webAppUrl: process.env.WEBAPP_URL || 'http://localhost:5173',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  allowDevAuth: process.env.ALLOW_DEV_AUTH === 'true',
  shopName: 'Kisva Shop',
  currency: 'so‘m',
  texts: {
    start: (name) =>
      `<b>${name}, xush kelibsiz!</b> 👋\n\n` +
      `Assalomu alaykum ART-SHERZOD galereyasiga xush kelibsiz!\n\n` +
      `Har bir Kisva Ka‘ba po‘shtimiz sertifikatga ega.\n\n` +
      `Buyurtma berish uchun pastdagi 🛍 Do‘kon tugmasini bosing 👇`,
    orderAccepted: 'Xarid uchun rahmat! Admin siz bilan bog‘lanadi 🕋',
    help:
      'Buyurtma berish uchun <b>🛍 Do‘kon</b> tugmasini bosing.\n' +
      'Savollar bo‘lsa — /start buyrug‘ini yuboring.',
  },
};

if (!config.botToken) {
  console.error('❌ .env faylida BOT_TOKEN topilmadi!');
}

export default config;
