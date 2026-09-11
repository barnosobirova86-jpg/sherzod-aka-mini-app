import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import config from '../config/default.js';
import { sendMessage } from '../core/bot.js';
import { uploadImage, UPLOAD_DIR } from '../middlewares/upload.middleware.js';

export function login(req, res) {
  const { password } = req.body;
  if (password !== config.adminPassword) {
    return res.status(401).json({ message: "Parol noto'g'ri" });
  }
  res.json({ ok: true, token: password });
}

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
    res.status(500).json({ message: 'Server xatosi' });
  }
}

/* ---------------- BUYURTMALAR ---------------- */

export async function getOrders(req, res) {
  try {
    res.json(await Order.findAll({ status: req.query.status }));
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'delivered', 'canceled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Noto'g'ri holat" });
    }

    const order = await Order.updateStatus(req.params.id, status);
    const full = await Order.findById(order.id);

    if (status === 'delivered' && full?.user) {
      await sendMessage(
        full.user.telegramId,
        `✅ <b>Buyurtma #${full.id}</b> yetkazib berildi.\nXaridingiz uchun rahmat! 🕋`
      );
    }
    if (status === 'canceled' && full?.user) {
      await sendMessage(
        full.user.telegramId,
        `❌ <b>Buyurtma #${full.id}</b> bekor qilindi.\nSavollar uchun biz bilan bog'laning.`
      );
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Holatni yangilashda xato' });
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
    res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function createProduct(req, res) {
  try {
    const data = normalizeProduct(req.body);
    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ message: 'Nom, narx va kategoriya majburiy' });
    }
    if (!data.imageUrl) data.imageUrl = 'https://picsum.photos/seed/kisva/800/800';
    res.status(201).json(await Product.create(data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mahsulot qo'shilmadi" });
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
    res.status(500).json({ message: 'Mahsulot yangilanmadi' });
  }
}

export async function deleteProduct(req, res) {
  try {
    await Product.remove(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Mahsulot o'chirilmadi" });
  }
}

/* ---------------- RASMLAR ---------------- */

/**
 * Kompyuterdan rasm yuklash -> /uploads/<fayl nomi>
 */
export function uploadProductImage(req, res) {
  uploadImage(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    if (!req.file) return res.status(400).json({ message: 'Rasm tanlanmadi' });
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
      .filter((name) => /\.(jpe?g|png|webp|gif|avif)$/i.test(name))
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
