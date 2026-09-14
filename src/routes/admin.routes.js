import { Router } from 'express';
import { addClient, removeClient } from '../core/sse.js';
import {
  getStats,
  getOrders,
  updateOrderStatus,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadProductVideo,
  listUploads,
  listVideoUploads,
} from '../controllers/adminController.js';

const router = Router();

/**
 * Yangi buyurtmalarni jonli (real-time) kuzatish uchun oqim.
 */
router.get('/events', (req, res) => {
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

router.get('/stats', getStats);

router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.post('/upload', uploadProductImage);
router.get('/uploads', listUploads);

router.post('/upload-video', uploadProductVideo);
router.get('/video-uploads', listVideoUploads);

export default router;
