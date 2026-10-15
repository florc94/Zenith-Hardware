import { Router } from 'express';

import {
  getMyProfile,
  updateMyProfile,
  updateMyContact,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser
} from '../controllers/users.controller';

import {
  verifyToken,
  verifyAdmin
} from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// MI CUENTA
// Requiere iniciar sesión, pero NO ser admin
// (van ANTES de router.use(verifyAdmin))
// ==========================================

router.get(
  '/me',
  verifyToken,
  getMyProfile
);

router.put(
  '/me',
  verifyToken,
  updateMyProfile
);

// Guarda solo código de área, teléfono y DNI/CUIL
// (ventana que aparece al verificar la cuenta)
router.patch(
  '/me/contact',
  verifyToken,
  updateMyContact
);

// ==========================================
// ADMINISTRACIÓN DE USUARIOS
// Solo administradores
// ==========================================

router.use(verifyAdmin);

router.get(
  '/',
  getUsers
);

router.get(
  '/:id',
  getUserById
);

router.patch(
  '/:id/role',
  updateUserRole
);

router.delete(
  '/:id',
  deleteUser
);

export default router;