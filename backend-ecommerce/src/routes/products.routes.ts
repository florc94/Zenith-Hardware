import { Router } from 'express';

import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/products.controller';

const router = Router();

router.get(
  '/',
  getProducts
);

router.post(
  '/',
  createProduct
);

// IMPORTANTE:
// debe estar antes de /:id
router.get(
  '/categories',
  getCategories
);

router.get(
  '/:id',
  getProductById
);

router.put(
  '/:id',
  updateProduct
);

router.delete(
  '/:id',
  deleteProduct
);

export default router;