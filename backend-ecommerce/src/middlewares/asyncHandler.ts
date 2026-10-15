import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un controller async para que cualquier error caído
 * en una promesa sea pasado automáticamente a next() (y de ahí
 * al errorHandler), sin necesidad de try/catch repetido.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
