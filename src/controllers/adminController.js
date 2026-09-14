import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendMessage } from '../core/bot.js';
import { uploadImage, UPLOAD_DIR } from '../middlewares/upload.middleware.js';

export async function getStats(req, res) {
  try {
    const [orders, products, users, revenue] = await Promise.all([
      Order.count(),
      Product.count(),
      User.count(),
      Order.totalRevenue(),
    ]);
    res.json({ orders, products, users, revenue });
  } catch (error) {
    res.status(500).json({ message: 'Сервер хатоси' });
  }
}

/* ---------------- BUYURTMALAR ---------------- */

export async function getOrders(req, res) {
  try {
    res.json(await Order.findAll({ status: req.query.status }));
  } catch (error) {
    res.status(500).json({ message: 'Сервер хатоси' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'delivered', 'canceled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Нотўғри ҳолат' });
    }

    const order = await Order.updateStatus(req.params.id, status);
    const full = await Order.findById(order.id);

    if (status === 'delivered' && full?.user) {
      await sendMessage(
        full.user.telegramId,
        `✅ <b>Буюртма #${full.id}</b> етказиб берилди.\nХаридингиз учун раҳмат! 🕋`
      );
    }
    if (status === 'canceled' && full?.user) {
      await sendMessage(
        full.user.telegramId,
        `❌ <b>Буюртма #${full.id}</b> бекор қилинди.\nСаволлар учун биз билан боғланинг.`
      );
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ҳолатни янгилашда хато' });
  }
}

/* ---------------- MAHSULOTLAR (CRUD) ---------------- */

function normalizeProduct(body) {
  const toArray = (value) => {
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === 'string')
      return value
        .split(/[\n,]/)
        .map((v) => v.trim())
        .filter(Boolean);
    return [];
  };

  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    imageUrl: String(body.imageUrl || '').trim(),
    category: String(body.category || '').trim(),
    price: Number(body.price) || 0,
    oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
    currency: body.currency === 'USD' ? 'USD' : 'UZS',
    stock: Math.max(0, Number(body.stock) || 0),
    sizes: toArray(body.sizes),
    features: toArray(body.features),
    isRecommended: Boolean(body.isRecommended),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

export async function getAllProducts(req, res) {
  try {
    res.json(await Product.findAll({ onlyActive: false }));
  } catch (error) {
    res.status(500).json({ message: 'Сервер хатоси' });
  }
}

export async function createProduct(req, res) {
  try {
    const data = normalizeProduct(req.body);
    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ message: 'Ном, нарх ва категория мажбурий' });
    }
    if (!data.imageUrl) data.imageUrl = 'https://picsum.photos/seed/kisva/800/800';
    res.status(201).json(await Product.create(data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Маҳсулот қўшилмади' });
  }
}

export async function updateProduct(req, res) {
  try {
    const data = normalizeProduct(req.body);
    // Rasm bo'sh yuborilsa — eskisi saqlanib qoladi
    if (!data.imageUrl) delete data.imageUrl;
    res.json(await Product.update(req.params.id, data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Маҳсулот янгиланмади' });
  }
}

export async function deleteProduct(req, res) {
  try {
    await Product.remove(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Маҳсулот ўчирилмади' });
  }
}

/* ---------------- RASMLAR ---------------- */

/**
 * Kompyuterdan rasm yuklash -> /uploads/<fayl nomi>
 */
export function uploadProductImage(req, res) {
  uploadImage(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    if (!req.file) return res.status(400).json({ message: 'Расм танланмади' });
    res.json({ url: `/uploads/${req.file.filename}`, name: req.file.filename });
  });
}

/**
 * public/uploads papkasidagi barcha rasmlar ro'yxati
 */
export function listUploads(req, res) {
  try {
    const files = fs
      .readdirSync(UPLOAD_DIR)
      .filter((name) => /\.(jpe?g|png|webp|gif|avif|bmp|tiff?|heic|heif|svg)$/i.test(name))
      .map((name) => ({
        name,
        url: `/uploads/${name}`,
        time: fs.statSync(path.join(UPLOAD_DIR, name)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    res.json(files);
  } catch (error) {
    res.json([]);
  }
}
