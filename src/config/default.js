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
  shopName: 'Кисва Шоп',
  currency: 'сўм',
  texts: {
    start: (name) =>
      `<b>${name} ака, хуш келибсиз!</b> 👋\n\n` +
      `Ассалому алайкум. <b>Кисва Шоп</b> — Каъбаи муаззаманинг муқаддас кисвасидан асл бўлаклар.\n\n` +
      `Ҳар бир маҳсулот расмий сертификат билан тақдим этилади.\n\n` +
      `Буюртма бериш учун пастдаги тугмани босинг 👇`,
    orderAccepted:
      'Буюртмангиз муваффақиятли қабул қилинди! Курьеримиз тез орада боғланади 🕋',
    help:
      'Буюртма бериш учун <b>🛍 Дўконни очиш</b> тугмасини босинг.\n' +
      'Саволлар бўлса — /start буйруғини юборинг.',
  },
};

if (!config.botToken) {
  console.error('❌ .env faylida BOT_TOKEN topilmadi!');
}

export default config;
