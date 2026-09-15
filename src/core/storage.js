import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

/*
 * Fayllarni doimiy saqlash.
 *
 * Uch xil rejim bor va ular avtomatik tanlanadi:
 *   1. Supabase Storage  — SUPABASE_URL + SUPABASE_SERVICE_KEY berilsa
 *   2. S3‘ga mos ombor   — S3_ENDPOINT + S3_BUCKET + kalitlar berilsa
 *      (Backblaze B2, Cloudflare R2, Wasabi va boshqalar)
 *   3. Mahalliy disk     — hech narsa sozlanmagan bo‘lsa
 *
 * Supabase bilan uning rasmiy kutubxonasi orqali emas, oddiy HTTP so‘rov
 * orqali ishlaymiz: kutubxona Node 22 talab qiladi, Render‘da esa Node 20.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

const S3_ENDPOINT = process.env.S3_ENDPOINT || '';
const S3_BUCKET = process.env.S3_BUCKET || '';
const S3_KEY_ID = process.env.S3_KEY_ID || '';
const S3_SECRET = process.env.S3_SECRET || '';
const S3_REGION = process.env.S3_REGION || 'auto';
/* Ochiq havola manzili, masalan: https://f003.backblazeb2.com/file/mening-bucket */
const S3_PUBLIC_URL = (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '');

const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
const s3Ready = Boolean(S3_ENDPOINT && S3_BUCKET && S3_KEY_ID && S3_SECRET);

export const cloudEnabled = supabaseReady || s3Ready;
export const cloudProvider = supabaseReady ? 'supabase' : s3Ready ? 's3' : 'local';

const s3 = s3Ready
  ? new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: { accessKeyId: S3_KEY_ID, secretAccessKey: S3_SECRET },
    })
  : null;

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

const mimeOf = (file) =>
  file.mimetype || MIME[path.extname(file.filename).toLowerCase()] || 'application/octet-stream';

const supabaseHeaders = () => ({
  Authorization: `Bearer ${SUPABASE_KEY}`,
  apikey: SUPABASE_KEY,
});

const supabasePublicUrl = (name) =>
  `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(name)}`;

const s3PublicUrl = (name) =>
  S3_PUBLIC_URL
    ? `${S3_PUBLIC_URL}/${encodeURIComponent(name)}`
    : `${S3_ENDPOINT.replace(/\/+$/, '')}/${S3_BUCKET}/${encodeURIComponent(name)}`;

/**
 * Yuklangan (va siqilgan) faylni bulutga ko‘chiradi, ochiq havolasini qaytaradi.
 * Bulut sozlanmagan yoki xato bo‘lsa — mahalliy /uploads havolasi qaytadi.
 */
export async function storeUpload(file) {
  const localUrl = `/uploads/${file.filename}`;
  if (!cloudEnabled) return localUrl;

  try {
    const contentType = mimeOf(file);
    const body = await fs.promises.readFile(file.path);
    let url;

    if (supabaseReady) {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURIComponent(file.filename)}`,
        {
          method: 'POST',
          headers: {
            ...supabaseHeaders(),
            'Content-Type': contentType,
            'x-upsert': 'true',
          },
          body,
        }
      );

      if (!response.ok) {
        throw new Error(`Supabase ${response.status}: ${await response.text()}`);
      }
      url = supabasePublicUrl(file.filename);
    } else {
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.filename,
          Body: body,
          ContentType: contentType,
        })
      );
      url = s3PublicUrl(file.filename);
    }

    // Bulutga o‘tgach, serverdagi vaqtinchalik nusxa kerak emas
    fs.promises.unlink(file.path).catch(() => {});
    console.log(`☁️ Fayl bulutda saqlandi (${cloudProvider}): ${file.filename}`);

    return url;
  } catch (error) {
    console.error('Bulutga yuklashda xato, mahalliy nusxa ishlatiladi:', error.message);
    return localUrl;
  }
}

/**
 * Bulutdagi fayllar ro‘yxati (admin paneldagi galereya uchun).
 * Bulut sozlanmagan bo‘lsa null qaytadi — chaqiruvchi mahalliy papkani o‘qiydi.
 */
export async function listCloudFiles(match) {
  if (!cloudEnabled) return null;

  try {
    if (supabaseReady) {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`, {
        method: 'POST',
        headers: { ...supabaseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: '',
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Supabase ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data
        .filter((f) => match.test(f.name))
        .map((f) => ({
          name: f.name,
          url: supabasePublicUrl(f.name),
          time: new Date(f.created_at || Date.now()).getTime(),
        }));
    }

    const { Contents = [] } = await s3.send(
      new ListObjectsV2Command({ Bucket: S3_BUCKET, MaxKeys: 500 })
    );

    return Contents.filter((o) => match.test(o.Key))
      .map((o) => ({
        name: o.Key,
        url: s3PublicUrl(o.Key),
        time: new Date(o.LastModified || Date.now()).getTime(),
      }))
      .sort((a, b) => b.time - a.time);
  } catch (error) {
    console.error('Bulut ro‘yxatini olishda xato:', error.message);
    return [];
  }
}
