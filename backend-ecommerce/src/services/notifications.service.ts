import { pool } from '../config/db';

export interface CreateNotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  orderId?: number | null;
}


// =====================================================
// CREAR NOTIFICACIÓN
// =====================================================

export async function createNotification(
  data: CreateNotificationData
): Promise<void> {

  await pool.query(
    `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      order_id
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.orderId ?? null
    ]
  );

}


// =====================================================
// OBTENER NOTIFICACIONES DEL USUARIO
// =====================================================

export async function getUserNotifications(
  userId: number
) {

  const result = await pool.query(
    `
    SELECT
      id,
      type,
      title,
      message,
      order_id AS "orderId",
      is_read AS "isRead",
      created_at AS "createdAt"
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [userId]
  );

  return result.rows;

}


// =====================================================
// CONTAR NO LEÍDAS
// =====================================================

export async function getUnreadNotificationsCount(
  userId: number
): Promise<number> {

  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE user_id = $1
      AND is_read = FALSE
    `,
    [userId]
  );

  return result.rows[0].count;

}


// =====================================================
// MARCAR UNA COMO LEÍDA
// =====================================================

export async function markNotificationAsRead(
  userId: number,
  notificationId: number
): Promise<void> {

  await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
      AND user_id = $2
    `,
    [
      notificationId,
      userId
    ]
  );

}


// =====================================================
// MARCAR TODAS COMO LEÍDAS
// =====================================================

export async function markAllNotificationsAsRead(
  userId: number
): Promise<void> {

  await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1
      AND is_read = FALSE
    `,
    [userId]
  );

}