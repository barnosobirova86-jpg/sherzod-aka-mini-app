import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Fayl nomini xavfsiz holatga keltirish (lotin harflar, raqam, tire)
 */
function safeName(original) {
  const ext = path.extname(original).toLowerCase() || '.jpg';
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  let name = `${base || 'rasm'}${ext}`;
  let counter = 1;

  while (fs.existsSync(path.join(UPLOAD_DIR, name))) {
    name = `${base || 'rasm'}-${counter}${ext}`;
    counter += 1;
  }

  return name;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, safeName(file.originalname)),
});

/*
 * Ba‘zi telefonlar (ayniqsa iPhone HEIC va Android‘dagi ba‘zi formatlar uchun)
 * fayl turini "application/octet-stream" deb yuboradi. Shu sababli faqat
 * mimetype‘ga ishonmaymiz — fayl kengaytmasini ham tekshiramiz.
 */
const IMAGE_EXT = /\.(jpe?g|jfif|png|webp|gif|avif|bmp|tiff?|heic|heif|svg|ico|dng|raw|cr2|nef|arw)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|hevc|mpe?g|wmv|flv|ts)$/i;

const accept = (prefix, extPattern, label) => (req, file, cb) => {
  const ok =
    (file.mimetype || '').startsWith(`${prefix}/`) || extPattern.test(file.originalname || '');
  if (ok) return cb(null, true);
  cb(new Error(`Faqat ${label} fayllari qabul qilinadi`));
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: accept('image', IMAGE_EXT, 'rasm'),
}).single('image');

export const uploadVideo = multer({
  storage,
  // 4K, 5 daqiqagacha bo‘lgan videolar uchun (iPhone HEVC ~2-2.5 GB atrofida bo‘lishi mumkin)
  limits: { fileSize: 3 * 1024 * 1024 * 1024 },
  fileFilter: accept('video', VIDEO_EXT, 'video'),
}).single('video');
