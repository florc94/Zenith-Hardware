import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import apiRoutes from './routes';

import {
  errorHandler,
  notFoundHandler
} from './middlewares/errorHandler';

const app = express();

// ===============================
// CONFIGURACIÓN
// ===============================

const isProduction =
  process.env.NODE_ENV === 'production';

const allowedOrigins =
  process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
    : [];

// ===============================
// SEGURIDAD HTTP
// ===============================

app.use(
  helmet()
);

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: (origin, callback) => {

      // Permitir herramientas como Postman,
      // tests y requests sin Origin en desarrollo.
      if (!origin) {
        return callback(null, true);
      }

      // En desarrollo permitimos cualquier origen.
      if (!isProduction) {
        return callback(null, true);
      }

      // En producción solamente permitimos
      // los dominios configurados.
      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error('Origen no permitido por CORS')
      );
    },

    credentials: true
  })
);

// ===============================
// BODY PARSER
// ===============================

app.use(
  express.json({
    limit: '1mb'
  })
);

// ===============================
// RATE LIMIT GLOBAL
// ===============================

const globalLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 300,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      error:
        'Demasiadas solicitudes. Intentá nuevamente más tarde.'
    }
  });

app.use(
  globalLimiter
);

// ===============================
// RUTAS
// ===============================

app.use(
  '/api',
  apiRoutes
);

// ===============================
// MANEJO DE ERRORES
// ===============================

app.use(
  notFoundHandler
);

app.use(
  errorHandler
);

export default app;