import { Router } from 'express';

import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
} from '../controllers/favorites.controller';

import {
  verifyToken
} from '../middlewares/auth.middleware';


const router = Router();


// =====================================================
// TODAS LAS RUTAS DE FAVORITOS REQUIEREN LOGIN
// =====================================================

router.use(
  verifyToken
);


// =====================================================
// OBTENER FAVORITOS
// GET /api/favorites
// =====================================================

router.get(
  '/',
  getFavorites
);


// =====================================================
// AGREGAR FAVORITO
// POST /api/favorites/:productId
// =====================================================

router.post(
  '/:productId',
  addFavorite
);


// =====================================================
// ELIMINAR FAVORITO
// DELETE /api/favorites/:productId
// =====================================================

router.delete(
  '/:productId',
  removeFavorite
);


// =====================================================
// COMPROBAR FAVORITO
// GET /api/favorites/check/:productId
// =====================================================

router.get(
  '/check/:productId',
  checkFavorite
);


export default router;