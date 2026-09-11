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
app.use(express.json({ limit: '2mb' }));

// Yuklangan rasmlar: public/uploads/rasm.jpg -> /uploads/rasm.jpg
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Kisva Shop API', time: new Date().toISOString() });
});

app.use('/api', clientRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Topilmadi' }));

async function start() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`🚀 API ishga tushdi: http://localhost:${config.port}`);
  });

  const bot = registerBotHandlers();

  try {
    const me = await bot.telegram.getMe();
    bot.launch().catch((e) => console.error('❌ Bot to\'xtadi:', e.message));
    console.log(`🤖 Telegram bot ishga tushdi: @${me.username}`);
  } catch (e) {
    console.error('❌ Bot ishga tushmadi:', e.message);
    console.error('   .env faylidagi BOT_TOKEN ni tekshiring.');
  }

  const shutdown = async (signal) => {
    console.log(`\n${signal} — to'xtatilmoqda...`);
    bot.stop(signal);
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start();
