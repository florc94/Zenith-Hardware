import { Router } from 'express';

import {
  getOrders,
  getOrdersMetrics,
  getSalesByPeriod,
  getOrderById,
  createOrder,
  updateOrderStatus
} from '../controllers/orders.controller';

import {
  verifyToken,
  verifyAdmin,
  verifyOrderAccess,
  verifyOrderDetailAccess,
  verifyCreateOrder
} from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// PEDIDOS DEL USUARIO
// ==========================================

router.get(
  '/',
  verifyOrderAccess,
  getOrders
);

// ==========================================
// MÉTRICAS ADMIN
// ==========================================

router.get(
  '/metrics',
  verifyAdmin,
  getOrdersMetrics
);

router.get(
  '/metrics/sales',
  verifyAdmin,
  getSalesByPeriod
);

// ==========================================
// DETALLE DE PEDIDO
// ==========================================

router.get(
  '/:id',
  verifyOrderDetailAccess,
  getOrderById
);

// ==========================================
// CREAR PEDIDO
// ==========================================

router.post(
  '/',
  verifyCreateOrder,
  createOrder
);

// ==========================================
// ACTUALIZAR ESTADO — ADMIN
// ==========================================

router.patch(
  '/:id/status',
  verifyAdmin,
  updateOrderStatus
);

export default router;