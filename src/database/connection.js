import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) bazasiga ulandi');
  } catch (error) {
    console.error('❌ Bazaga ulanishda xato:', error.message);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
