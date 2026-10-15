import { Router } from 'express';

import {
  getReviewsByProduct,
  createReview,
  deleteReview
} from '../controllers/reviews.controller';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// OBTENER REVIEWS DE UN PRODUCTO
// ==========================================

// GET /api/reviews/product/:productId
// Público
router.get(
  '/product/:productId',
  getReviewsByProduct
);


// ==========================================
// CREAR REVIEW
// ==========================================

// POST /api/reviews/product/:productId
// Requiere usuario autenticado
router.post(
  '/product/:productId',
  verifyToken,
  createReview
);


// ==========================================
// ELIMINAR REVIEW
// ==========================================

// DELETE /api/reviews/:id
// Requiere usuario autenticado
router.delete(
  '/:id',
  verifyToken,
  deleteReview
);

export default router;