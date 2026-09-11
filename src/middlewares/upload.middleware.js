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

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Faqat rasm fayllari (jpg, png, webp, gif) qabul qilinadi'));
  },
}).single('image');
