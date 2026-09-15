import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendMessage } from '../core/bot.js';
import { broadcast } from '../core/sse.js';
import { notifyAdmins } from '../core/notify.js';
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

/**
 * Mijoz mahsulotga sharh qoldiradi
 */
export async function addReview(req, res) {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Sharh matnini yozing' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });

    const review = {
      name:
        req.user.contactName ||
        [req.user.firstName, req.user.lastName].filter(Boolean).join(' ') ||
        'Mijoz',
      rating: Math.min(5, Math.max(1, Number(req.body.rating) || 5)),
      text: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    };

    const reviews = [review, ...(Array.isArray(product.reviews) ? product.reviews : [])].slice(
      0,
      100
    );

    const updated = await Product.update(product.id, { reviews });
    res.status(201).json(updated.reviews);
  } catch (error) {
    console.error('addReview xatosi:', error);
    res.status(500).json({ message: 'Sharh saqlanmadi' });
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

/**
 * Mijoz ism va telefon raqamini bir martalik saqlash
 */
export async function updateProfile(req, res) {
  try {
    const patch = {};

    // Qo‘shimcha raqam alohida ham yangilanishi mumkin (profil sahifasidan)
    if (req.body.extraPhone !== undefined) {
      patch.extraPhone = String(req.body.extraPhone || '').trim() || null;
    }

    if (req.body.contactName !== undefined) {
      patch.contactName = String(req.body.contactName || '').trim();
    }
    if (req.body.phone !== undefined) {
      patch.phone = String(req.body.phone || '').trim();
    }

    // Bir martalik ro‘yxatdan o‘tishda ikkalasi ham majburiy
    const isRegistration = patch.contactName !== undefined || patch.phone !== undefined;
    if (isRegistration && (!patch.contactName || !patch.phone)) {
      return res.status(400).json({ message: 'Ism va telefon raqami majburiy' });
    }

    const user = await User.updateContact(req.user.id, patch);
    res.json(user);
  } catch (error) {
    console.error('updateProfile xatosi:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
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
    const {
      items = [],
      name,
      phone,
      extraPhone,
      address,
      latitude,
      longitude,
      note,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Savatcha bo‘sh' });
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
        currency: product.currency || 'UZS',
        imageUrl: product.imageUrl,
        size: item.size || null,
        qty,
        sum,
      });
    }

    if (!preparedItems.length) {
      return res.status(400).json({ message: 'Mahsulotlar topilmadi' });
    }

    // Savatchada kiritilgan raqamlar profilda ham saqlanib qoladi
    const mainPhone = phone?.trim() || req.user.phone || null;
    const secondPhone =
      extraPhone === undefined ? req.user.extraPhone : extraPhone?.trim() || null;

    if (mainPhone !== req.user.phone || secondPhone !== req.user.extraPhone) {
      await User.updateContact(req.user.id, {
        ...(mainPhone !== req.user.phone ? { phone: mainPhone } : {}),
        ...(secondPhone !== req.user.extraPhone ? { extraPhone: secondPhone } : {}),
      });
    }

    // Admin ikkala raqamni ham ko‘radi
    const phoneLabel = [mainPhone, secondPhone].filter(Boolean).join(' / ') || null;

    const order = await Order.create({
      userId: req.user.id,
      items: preparedItems,
      totalPrice,
      customerName: name?.trim() || req.user.contactName || null,
      phone: phoneLabel,
      address: address?.trim() || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      note: note || null,
    });

    // Mijozga botdan xabar
    await sendMessage(req.user.telegramId, buildOrderMessage(order));

    // Admin panelga jonli xabar (yangilashga hojat qolmasin)
    broadcast('new-order', { orderId: order.id });

    // Do'kon egasiga Telegram/SMS xabari — buyurtmaga xalal bermasin
    notifyAdmins(order).catch((error) =>
      console.error('Adminlarga xabar yuborilmadi:', error.message)
    );

    res.status(201).json(order);
  } catch (error) {
    console.error('createOrder xatosi:', error);
    res.status(500).json({ message: 'Buyurtma saqlanmadi' });
  }
}
