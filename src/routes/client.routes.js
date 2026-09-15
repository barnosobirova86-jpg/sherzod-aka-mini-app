import { Router } from 'express';
import { telegramAuth } from '../middlewares/auth.middleware.js';
import {
  getProducts,
  getProduct,
  getCategories,
  getRecommended,
  getMe,
  getMyOrders,
  createOrder,
  updateProfile,
  addReview,
} from '../controllers/cartController.js';

const router = Router();

router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/categories', getCategories);
router.get('/recommended', getRecommended);

router.get('/me', telegramAuth, getMe);
router.post('/profile', telegramAuth, updateProfile);
router.get('/orders', telegramAuth, getMyOrders);
router.post('/orders', telegramAuth, createOrder);
router.post('/products/:id/reviews', telegramAuth, addReview);

export default router;
