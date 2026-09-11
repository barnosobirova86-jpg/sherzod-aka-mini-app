import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

/**
 * Neon (bepul tarif) baza faol so'rov bo'lmasa uxlab qoladi va
 * birinchi ulanish ba'zan bir necha soniya kechikadi yoki muvaffaqiyatsiz
 * bo'ladi — shu sababli bir necha marta qayta urinamiz.
 */
export async function connectDatabase(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL (Neon) bazasiga ulandi');
      return;
    } catch (error) {
      const isLast = attempt === retries;
      console.error(
        `⚠️  Bazaga ulanish urinishi ${attempt}/${retries} muvaffaqiyatsiz: ${error.message.split('\n')[0]}`
      );
      if (isLast) {
        console.error('❌ Bazaga ulanib bo\'lmadi. DATABASE_URL ni tekshiring.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
