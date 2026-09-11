import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendMessage } from '../core/bot.js';
import { buildOrderMessage } from './botController.js';

export async function getProducts(req, res) {
  try {
    const products = await Product.findAll({ category: req.query.category });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Mahsulotlarni olishda xato' });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function getCategories(req, res) {
  try {
    res.json(await Product.categories());
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function getRecommended(req, res) {
  try {
    res.json(await Product.findRecommended());
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function getMe(req, res) {
  res.json(req.user);
}

export async function getMyOrders(req, res) {
  try {
    res.json(await Order.findByUserId(req.user.id));
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
}

/**
 * Buyurtma yaratish.
 * Narxlar mijozdan emas, bazadan olinadi (xavfsizlik uchun).
 */
export async function createOrder(req, res) {
  try {
    const { items = [], phone, latitude, longitude, note } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Savatcha bo'sh" });
    }

    const preparedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) continue;

      const qty = Math.max(1, Number(item.qty) || 1);
      const sum = product.price * qty;
      totalPrice += sum;

      preparedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        size: item.size || null,
        qty,
        sum,
      });
    }

    if (!preparedItems.length) {
      return res.status(400).json({ message: 'Mahsulotlar topilmadi' });
    }

    if (phone && phone !== req.user.phone) {
      await User.updatePhone(req.user.id, phone);
    }

    const order = await Order.create({
      userId: req.user.id,
      items: preparedItems,
      totalPrice,
      phone: phone || req.user.phone || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      note: note || null,
    });

    // Mijozga botdan xabar
    await sendMessage(req.user.telegramId, buildOrderMessage(order));

    res.status(201).json(order);
  } catch (error) {
    console.error('createOrder xatosi:', error);
    res.status(500).json({ message: 'Buyurtma saqlanmadi' });
  }
}
