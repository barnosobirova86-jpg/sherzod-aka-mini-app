import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

/**
 * Supabase sozlangan bo'lsa — fayllar bulutda saqlanadi (server qayta
 * ishga tushsa ham yo'qolmaydi). Sozlanmagan bo'lsa — eski holicha
 * serverning o'z diskida qoladi.
 */
export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

const client = cloudEnabled ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.m4v': 'video/x-m4v',
};

/**
 * Yuklangan faylni bulutga ko'chiradi va ochiq havolasini qaytaradi.
 * Bulut sozlanmagan bo'lsa — mahalliy /uploads havolasini qaytaradi.
 */
export async function storeUpload(file) {
  const localUrl = `/uploads/${file.filename}`;
  if (!cloudEnabled) return localUrl;

  const ext = path.extname(file.filename).toLowerCase();

  try {
    const body = fs.createReadStream(file.path);
    const { error } = await client.storage.from(BUCKET).upload(file.filename, body, {
      contentType: file.mimetype || MIME[ext] || 'application/octet-stream',
      upsert: true,
      duplex: 'half',
    });

    if (error) throw error;

    const { data } = client.storage.from(BUCKET).getPublicUrl(file.filename);

    // Bulutga o'tgach, serverdagi vaqtinchalik nusxa kerak emas
    fs.promises.unlink(file.path).catch(() => {});

    return data.publicUrl;
  } catch (error) {
    console.error('Bulutga yuklashda xato, mahalliy nusxa ishlatiladi:', error.message);
    return localUrl;
  }
}

/**
 * Bulutdagi fayllar ro'yxati (admin paneldagi galereya uchun)
 */
export async function listCloudFiles(match) {
  if (!cloudEnabled) return null;

  const { data, error } = await client.storage.from(BUCKET).list('', {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    console.error('Bulut ro‘yxatini olishda xato:', error.message);
    return [];
  }

  return data
    .filter((f) => match.test(f.name))
    .map((f) => ({
      name: f.name,
      url: client.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      time: new Date(f.created_at || Date.now()).getTime(),
    }));
}
