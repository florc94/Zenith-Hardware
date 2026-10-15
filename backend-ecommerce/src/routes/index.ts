import { Router } from 'express';

import healthRoutes from './health.routes';
import productsRoutes from './products.routes';
import cartRoutes from './cart.routes';
import ordersRoutes from './orders.routes';
import authRoutes from './auth.routes';
import favoritesRoutes from './favorites.routes';
import reviewsRoutes from './reviews.routes';
import notificationsRoutes from './notifications.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/auth', authRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/users', usersRoutes);

export default router;