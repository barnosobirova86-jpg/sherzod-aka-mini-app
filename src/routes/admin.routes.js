import { Router } from 'express';
import { adminAuth } from '../middlewares/auth.middleware.js';
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
