import { Router } from 'express';

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notifications.controller';

import {
  verifyToken
} from '../middlewares/auth.middleware';

const router = Router();


// =====================================================
// AUTENTICACIÓN
// Todas las rutas de notificaciones requieren JWT
// =====================================================

router.use(
  verifyToken
);


// =====================================================
// OBTENER NOTIFICACIONES
// GET /api/notifications
// =====================================================

router.get(
  '/',
  getNotifications
);


// =====================================================
// CONTAR NO LEÍDAS
// GET /api/notifications/unread-count
// =====================================================

router.get(
  '/unread-count',
  getUnreadCount
);


// =====================================================
// MARCAR UNA COMO LEÍDA
// PATCH /api/notifications/:id/read
// =====================================================

router.patch(
  '/:id/read',
  markAsRead
);


// =====================================================
// MARCAR TODAS COMO LEÍDAS
// PATCH /api/notifications/read-all
// =====================================================

router.patch(
  '/read-all',
  markAllAsRead
);


export default router;