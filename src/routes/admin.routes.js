import { Router } from 'express';
import { adminAuth } from '../middlewares/auth.middleware.js';
import config from '../config/default.js';
import { addClient, removeClient } from '../core/sse.js';
import {
  login,
  getStats,
  getOrders,
  updateOrderStatus,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  listUploads,
} from '../controllers/adminController.js';

const router = Router();

router.post('/login', login);

/**
 * Yangi buyurtmalarni jonli (real-time) kuzatish uchun oqim.
 * EventSource maxsus header yubora olmagani uchun parol query orqali tekshiriladi.
 */
router.get('/events', (req, res) => {
  if (req.query.password !== config.adminPassword) {
    return res.status(401).end();
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('\n');

  addClient(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(res);
  });
});

router.use(adminAuth);

router.get('/stats', getStats);

router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.post('/upload', uploadProductImage);
router.get('/uploads', listUploads);

export default router;
