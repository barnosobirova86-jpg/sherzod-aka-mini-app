// Do‘kon kategoriyalari — admin panelda mahsulot qo‘shishda ham
// aynan shu ro‘yxatdan tanlanadi, shuning uchun bu yerda o‘zgartirilsa
// admin/src/categories.js faylida ham yangilash kerak.
export const CATEGORIES = [
  { name: 'Kisva', icon: '🕋' },
  { name: 'Noyob Qur‘on kitoblar', icon: '🕌' },
  { name: 'Art Calligraphy', icon: '🖋️' },
  { name: 'Kartinalar / Handmade craft', icon: '🖼️' },
];

/**
 * Uzun nomlar tugmada ikki qatorga bo'linib ko'rsatiladi
 * ("Kartinalar / Handmade craft" -> "Kartinalar" va "Handmade craft")
 */
export const categoryLines = (name) => String(name).split(' / ');
