import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/* Mini App‘da rasm eng ko‘pi bilan shu o‘lchamda ko‘rsatiladi */
const MAX_IMAGE_SIDE = 2000;
const IMAGE_QUALITY = 82;

/* Video 1080p ga tushiriladi — telefon ekrani uchun yetarli */
const MAX_VIDEO_HEIGHT = 1080;

const isHeic = (file) => {
  const ext = path.extname(file.filename).toLowerCase();
  return ext === '.heic' || ext === '.heif' || /hei[cf]/i.test(file.mimetype || '');
};

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

function sizeOf(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Yuklangan rasmni brauzerlar tushunadigan, yengil WEBP ga aylantiradi.
 * iPhone‘ning HEIC formati ham shu yerda oddiy formatga o‘tkaziladi.
 * Xato bo‘lsa — original fayl o‘zgarishsiz qoladi.
 */
export async function processImage(file) {
  const before = sizeOf(file.path);

  try {
    let input = await fs.promises.readFile(file.path);

    if (isHeic(file)) {
      input = await heicConvert({ buffer: input, format: 'JPEG', quality: 0.92 });
    }

    const newFilename = `${file.filename.replace(/\.[^.]+$/, '')}.webp`;
    const newPath = path.join(path.dirname(file.path), newFilename);

    await sharp(input, { failOn: 'none' })
      .rotate() // EXIF burchagini to‘g‘rilaydi (telefonda yonboshlab olingan rasmlar uchun)
      .resize({
        width: MAX_IMAGE_SIDE,
        height: MAX_IMAGE_SIDE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY })
      .toFile(newPath);

    if (newPath !== file.path) {
      await fs.promises.unlink(file.path).catch(() => {});
    }

    file.path = newPath;
    file.filename = newFilename;
    file.mimetype = 'image/webp';

    console.log(`🖼 Rasm siqildi: ${mb(before)} MB → ${mb(sizeOf(newPath))} MB (${newFilename})`);
  } catch (error) {
    console.error('Rasmni siqishda xato, original saqlanadi:', error.message);
  }

  return file;
}

/**
 * Yuklangan videoni 1080p MP4 (H.264) ga aylantiradi — barcha telefonlarda
 * ochiladi va tez yuklanadi. Xato bo‘lsa — original fayl qoladi.
 */
export async function processVideo(file) {
  const before = sizeOf(file.path);
  const newFilename = `${file.filename.replace(/\.[^.]+$/, '')}-web.mp4`;
  const newPath = path.join(path.dirname(file.path), newFilename);
  const originalPath = file.path;

  return new Promise((resolve) => {
    ffmpeg(originalPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-vf',
        `scale=-2:'min(${MAX_VIDEO_HEIGHT},ih)'`,
        '-crf',
        '26',
        '-preset',
        'veryfast',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
      ])
      .on('end', async () => {
        await fs.promises.unlink(originalPath).catch(() => {});
        file.path = newPath;
        file.filename = newFilename;
        file.mimetype = 'video/mp4';
        console.log(`🎬 Video siqildi: ${mb(before)} MB → ${mb(sizeOf(newPath))} MB (${newFilename})`);
        resolve(file);
      })
      .on('error', async (error) => {
        console.error('Videoni siqishda xato, original saqlanadi:', error.message);
        await fs.promises.unlink(newPath).catch(() => {});
        resolve(file);
      })
      .save(newPath);
  });
}
