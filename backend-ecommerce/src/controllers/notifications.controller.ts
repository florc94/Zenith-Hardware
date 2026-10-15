import { Request, Response } from 'express';

import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notifications.service';


// =====================================================
// OBTENER NOTIFICACIONES
// =====================================================

export async function getNotifications(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId = Number(
      (req as any).user?.id
    );

    if (!userId) {

      res.status(401).json({
        message: 'Usuario no autenticado'
      });

      return;

    }

    const notifications =
      await getUserNotifications(
        userId
      );

    res.json(
      notifications
    );

  } catch (error) {

    console.error(
      'Error al obtener notificaciones:',
      error
    );

    res.status(500).json({
      message: 'Error al obtener notificaciones'
    });

  }

}


// =====================================================
// CONTAR NO LEÍDAS
// =====================================================

export async function getUnreadCount(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId = Number(
      (req as any).user?.id
    );

    if (!userId) {

      res.status(401).json({
        message: 'Usuario no autenticado'
      });

      return;

    }

    const count =
      await getUnreadNotificationsCount(
        userId
      );

    res.json({
      count
    });

  } catch (error) {

    console.error(
      'Error al contar notificaciones:',
      error
    );

    res.status(500).json({
      message: 'Error al contar notificaciones'
    });

  }

}


// =====================================================
// MARCAR UNA COMO LEÍDA
// =====================================================

export async function markAsRead(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId = Number(
      (req as any).user?.id
    );

    const notificationId =
      Number(req.params.id);

    if (!userId) {

      res.status(401).json({
        message: 'Usuario no autenticado'
      });

      return;

    }

    if (!notificationId) {

      res.status(400).json({
        message: 'ID de notificación inválido'
      });

      return;

    }

    await markNotificationAsRead(
      userId,
      notificationId
    );

    res.json({
      message: 'Notificación marcada como leída'
    });

  } catch (error) {

    console.error(
      'Error al marcar notificación:',
      error
    );

    res.status(500).json({
      message: 'Error al marcar notificación'
    });

  }

}


// =====================================================
// MARCAR TODAS COMO LEÍDAS
// =====================================================

export async function markAllAsRead(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId = Number(
      (req as any).user?.id
    );

    if (!userId) {

      res.status(401).json({
        message: 'Usuario no autenticado'
      });

      return;

    }

    await markAllNotificationsAsRead(
      userId
    );

    res.json({
      message: 'Notificaciones marcadas como leídas'
    });

  } catch (error) {

    console.error(
      'Error al marcar todas las notificaciones:',
      error
    );

    res.status(500).json({
      message: 'Error al marcar todas las notificaciones'
    });

  }

}