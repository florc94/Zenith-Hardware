import { Request, Response } from 'express';

export function getHealth(req: Request, res: Response) {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
}
