import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAME = "Kisva — Makkani po'shti";

const products = [
  {
    name: NAME,
    description:
      "Ka'bai muazzamaning muqaddas kisvasidan olingan asl bo'lak. Oltin suvi yuritilgan ramkada, sertifikati bilan taqdim etiladi.",
    imageUrl: '/uploads/kisva-ramka-oltin.jpg',
    oldPrice: 15500000,
    price: 12900000,
    category: "Makkani po'shti",
    sizes: ['Katta (90x150 sm)'],
    features: [
      "Ka'ba kisvasidan asl bo'lak",
      'Qo\'lda tikilgan oltin kashta',
      'Oltin suvi yuritilgan yog\'och ramka',
      'Rasmiy sertifikat bilan',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Ka'ba eshigi (Bobi Ka'ba) pardasining nusxasi. Kumush va oltin iplar bilan tikilgan, katta o'lchamli nodir asar.",
    imageUrl: '/uploads/kisva-kaba-eshigi.png',
    oldPrice: 11800000,
    price: 9500000,
    category: "Ka'ba eshigi",
    sizes: ['Katta (100x170 sm)'],
    features: [
      "Ka'ba eshigi pardasi nusxasi",
      'Kumush va oltin ip kashta',
      'Muzey darajasidagi sifat',
      'Maxsus qadoqda yetkaziladi',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Uchta oltin medalyonli vertikal pano. Qora kisva matosida 'Allohdan o'zga iloh yo'q' kalimasi tikilgan.",
    imageUrl: '/uploads/kisva-uch-medalyon.png',
    oldPrice: 9200000,
    price: 7800000,
    category: "Makkani po'shti",
    sizes: ["O'rta (70x140 sm)"],
    features: [
      '3 ta oltin medalyon',
      'Qora ipak kisva matosi',
      'Vertikal pano ko\'rinishida',
      'Devorga osish uchun tayyor',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Ka'ba eshigining oltin naqshli bo'lagi. Nozik ishlangan, uyingiz yoki ofisingiz uchun ko'rkam sovg'a.",
    imageUrl: '/uploads/kisva-eshik-oltin.png',
    oldPrice: 8400000,
    price: 6900000,
    category: "Ka'ba eshigi",
    sizes: ["O'rta (60x110 sm)"],
    features: [
      'Oltin rangli nozik naqsh',
      "Ka'ba eshigi motivi",
      'Yorug\'likda tovlanadi',
      'Sovg\'abop qadoq',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Ichki kisvaning yashil va tashqi qora bo'lagi bir ramkada. Ikkala mato ham asl, alohida sertifikatlangan.",
    imageUrl: '/uploads/kisva-yashil-qora.png',
    oldPrice: 7600000,
    price: 6200000,
    category: 'Kolleksiya',
    sizes: ["O'rta (55x75 sm)"],
    features: [
      "2 ta asl bo'lak: yashil va qora",
      'Ichki va tashqi kisva',
      'Oltin ramka, muzey passepartusi',
      "Har bo'lak alohida sertifikatli",
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Qizil-bordo rangdagi nodir kisva bo'lagi. Kolleksionerlar uchun maxsus, cheklangan miqdorda.",
    imageUrl: '/uploads/kisva-qizil.png',
    oldPrice: 6800000,
    price: 5700000,
    category: 'Kolleksiya',
    sizes: ["Kichik (45x60 sm)"],
    features: [
      'Nodir bordo rangdagi mato',
      'Cheklangan miqdorda',
      'Kolleksionerlar uchun',
      'Oltin hoshiyali ramka',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Doira shaklidagi kufiy xat bilan bezatilgan kisva bo'lagi. Markazida Qur'on oyati tikilgan.",
    imageUrl: '/uploads/kisva-doira.png',
    oldPrice: 5900000,
    price: 4900000,
    category: "Makkani po'shti",
    sizes: ["Kichik (40x40 sm)"],
    features: [
      'Doira shaklidagi kompozitsiya',
      'Kufiy xat bilan tikilgan',
      "Markazida Qur'on oyati",
      'Ish stoli yoki devor uchun',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Oltin kashtali ikki bo'lakli kisva to'plami. Asl mato, Makkadan olib kelingan va tasdiqlangan.",
    imageUrl: '/uploads/kisva-oltin-naqsh.png',
    oldPrice: 5400000,
    price: 4500000,
    category: "Makkani po'shti",
    sizes: ["Kichik (35x50 sm)"],
    features: [
      "2 bo'lakli to'plam",
      'Qalin oltin ip kashta',
      'Makkadan olib kelingan',
      'Tasdiqlovchi hujjat bilan',
    ],
    isRecommended: false,
  },
  {
    name: NAME,
    description:
      "Rasmiy sertifikat ilova qilingan kisva bo'lagi. Sovg'a qilish uchun eng ko'p tanlanadigan variant.",
    imageUrl: '/uploads/kisva-sertifikat.png',
    oldPrice: 4900000,
    price: 4200000,
    category: 'Kolleksiya',
    sizes: ["Kichik (30x30 sm)"],
    features: [
      'Rasmiy sertifikat ilovasi',
      "Sovg'a uchun ideal",
      'Qora ipak kisva matosi',
      'Shaffof himoya oynasi',
    ],
    isRecommended: true,
  },
];

async function main() {
  console.log('🌱 Seed boshlandi...');

  // Eski mahsulotlarni tozalash (buyurtmalar saqlanib qoladi)
  const deleted = await prisma.product.deleteMany({});
  console.log(`   🧹 ${deleted.count} ta eski mahsulot o'chirildi`);

  for (const product of products) {
    await prisma.product.create({ data: product });
    console.log(
      `   ✅ ${product.name} — ${product.price.toLocaleString('uz-UZ')} so'm (${product.category})`
    );
  }

  const total = await prisma.product.count();
  console.log(`\n🎉 Tayyor! Bazada jami ${total} ta mahsulot bor.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
