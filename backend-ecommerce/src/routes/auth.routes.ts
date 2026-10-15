import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  login,
  register,
  verifyEmail
} from '../controllers/auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error:
      'Demasiados intentos. Intentá nuevamente en unos minutos.'
  }
});

router.post(
  '/login',
  authLimiter,
  login
);

router.post(
  '/register',
  authLimiter,
  register
);

router.post(
  '/verify-email',
  authLimiter,
  verifyEmail
);

export default router;