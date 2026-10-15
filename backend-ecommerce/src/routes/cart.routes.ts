import { Router } from 'express';

import {
  getCart,
  saveCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();


// ==========================================
// OBTENER CARRITO
// GET /api/cart
// ==========================================

router.get(
  '/',
  verifyToken,
  getCart
);


// ==========================================
// AGREGAR / ACTUALIZAR PRODUCTO
// POST /api/cart/items
// ==========================================

router.post(
  '/items',
  verifyToken,
  saveCartItem
);


// ==========================================
// ELIMINAR PRODUCTO
// DELETE /api/cart/items/:id
// ==========================================

router.delete(
  '/items/:id',
  verifyToken,
  removeCartItem
);


// ==========================================
// VACIAR CARRITO
// DELETE /api/cart
// ==========================================

router.delete(
  '/',
  verifyToken,
  clearCart
);


export default router;