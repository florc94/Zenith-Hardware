import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global de manejo de errores.
 * Se coloca al final de todos los middlewares/rutas en index.ts.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    details: err?.message ?? undefined,
  });
}

/**
 * Middleware para rutas no encontradas (404).
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}
