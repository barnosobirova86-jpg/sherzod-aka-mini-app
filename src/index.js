import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/default.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { registerBotHandlers } from './routes/bot.routes.js';
import clientRoutes from './routes/client.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());

const WEBHOOK_PATH = '/telegram/webhook';

// Render.com kabi xostinglar avtomatik ravishda o'z ochiq manzilini beradi.
// U mavjud bo'lsa — webhook rejimi (uxlab qolsa ham keyingi xabarda uyg'onadi).
// Bo'lmasa (o'z kompyuteringizda) — oddiy polling rejimi ishlaydi.
const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || '';

const bot = registerBotHandlers();

// Webhook yo'li BOSHQA hamma routedan (va 404 tutuvchidan) oldin ro'yxatdan
// o'tishi shart — aks holda Telegram xabarlari hech qachon botga yetib bormaydi.
if (publicUrl) {
  app.use(bot.webhookCallback(WEBHOOK_PATH));
}

app.use(express.json({ limit: '2mb' }));

// Yuklangan rasmlar: public/uploads/rasm.jpg -> /uploads/rasm.jpg
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Kisva Shop API', time: new Date().toISOString() });
});

app.use('/api', clientRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Топилмади' }));

async function start() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`🚀 API ishga tushdi: http://localhost:${config.port}`);
  });

  // Katta video fayllar (4K, bir necha GB) sekin tarmoqda uzoq yuklanishi
  // mumkin — server ularni vaqtidan oldin uzib qo'ymasligi uchun.
  server.requestTimeout = 20 * 60 * 1000; // 20 daqiqa
  server.headersTimeout = 20 * 60 * 1000 + 5000;

  try {
    const me = await bot.telegram.getMe();

    if (publicUrl) {
      const webhookUrl = `${publicUrl.replace(/\/$/, '')}${WEBHOOK_PATH}`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`🤖 Telegram bot ishga tushdi (webhook): @${me.username}`);
      console.log(`   Webhook: ${webhookUrl}`);
    } else {
      await bot.telegram.deleteWebhook().catch(() => {});
      bot.launch().catch((e) => console.error('❌ Bot to\'xtadi:', e.message));
      console.log(`🤖 Telegram bot ishga tushdi (polling): @${me.username}`);
    }
  } catch (e) {
    console.error('❌ Bot ishga tushmadi:', e.message);
    console.error('   BOT_TOKEN ni tekshiring.');
  }

  const shutdown = async (signal) => {
    console.log(`\n${signal} — to'xtatilmoqda...`);
    if (!publicUrl) bot.stop(signal);
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start();
