import {
  Request,
  Response,
  NextFunction
} from 'express';

import jwt from 'jsonwebtoken';


// ==========================================
// CONFIGURACIÓN
// ==========================================

const JWT_SECRET: string =
  process.env.JWT_SECRET ?? '';

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está configurado. Definí JWT_SECRET en las variables de entorno.'
  );
}


// ==========================================
// EXTENDER REQUEST
// ==========================================

export interface AuthRequest extends Request {
  user?: any;
}


// ==========================================
// VERIFICAR USUARIO AUTENTICADO
// ==========================================

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  const authHeader =
    req.headers.authorization;

  // Verificar que exista Authorization
  // y que tenga el formato:
  // Bearer TOKEN
  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {

    return res.status(401).json({
      error:
        'Acceso denegado. No hay token proporcionado.'
    });
  }

  // Obtener solamente el token
  const token =
    authHeader.split(' ')[1];

  try {

    // ==========================================
    // VERIFICAR JWT
    // ==========================================

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    // Guardamos los datos del usuario
    // dentro de req.user
    req.user = decoded;

    next();

  } catch (error) {

    console.error(
      'Error verificando token:',
      error
    );

    return res.status(401).json({
      error:
        'Token inválido o expirado.'
    });
  }
};


// ==========================================
// VERIFICAR ADMIN
// ==========================================

export const verifyAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  verifyToken(
    req,
    res,
    () => {

      if (
        req.user?.role !== 'admin'
      ) {

        return res.status(403).json({
          error:
            'Acceso prohibido. Se requieren permisos de administrador.'
        });
      }

      next();
    }
  );
};


// ==========================================
// VERIFICAR ACCESO A LISTADO DE ÓRDENES
// ==========================================

export const verifyOrderAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  verifyToken(
    req,
    res,
    () => {

      // ==========================================
      // ADMINISTRADOR
      // ==========================================

      // El administrador puede consultar:
      // - todos los pedidos
      // - o filtrar por userId
      if (
        req.user?.role === 'admin'
      ) {
        return next();
      }

      // ==========================================
      // USUARIO NORMAL
      // ==========================================

      // El controller utilizará SIEMPRE
      // el ID proveniente del JWT.
      if (!req.user?.id) {

        return res.status(401).json({
          error:
            'Usuario no autenticado.'
        });
      }

      next();
    }
  );
};


// ==========================================
// VERIFICAR ACCESO AL DETALLE DE UNA ORDEN
// ==========================================

export const verifyOrderDetailAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  verifyToken(
    req,
    res,
    async () => {

      // ==========================================
      // ADMINISTRADOR
      // ==========================================

      // Admin puede consultar cualquier orden
      if (
        req.user?.role === 'admin'
      ) {
        return next();
      }

      // ==========================================
      // USUARIO NORMAL
      // ==========================================

      const orderId =
        req.params.id;

      const authenticatedUserId =
        req.user?.id?.toString();

      if (!orderId) {

        return res.status(400).json({
          error:
            'Se requiere el ID del pedido.'
        });
      }

      try {

        const { pool } =
          await import('../config/db');

        const result =
          await pool.query(
            `
            SELECT user_id
            FROM orders
            WHERE id = $1
            `,
            [
              orderId
            ]
          );

        if (
          result.rows.length === 0
        ) {

          return res.status(404).json({
            error:
              'Pedido no encontrado'
          });
        }

        const orderUserId =
          result.rows[0]
            .user_id
            ?.toString();

        if (
          orderUserId !==
          authenticatedUserId
        ) {

          return res.status(403).json({
            error:
              'No tienes permiso para consultar este pedido.'
          });
        }

        next();

      } catch (error) {

        console.error(
          'Error verificando acceso al pedido:',
          error
        );

        return res.status(500).json({
          error:
            'Error interno del servidor'
        });
      }
    }
  );
};


// ==========================================
// VERIFICAR CREACIÓN DE UNA ORDEN
// ==========================================

export const verifyCreateOrder = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  verifyToken(
    req,
    res,
    () => {

      // El usuario debe estar autenticado.
      // El ID se obtiene exclusivamente del JWT.
      if (!req.user?.id) {

        return res.status(401).json({
          error:
            'Usuario no autenticado.'
        });
      }

      next();
    }
  );
};