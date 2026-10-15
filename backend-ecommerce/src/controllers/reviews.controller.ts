import { Response } from 'express';

import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';


// ==========================================
// OBTENER REVIEWS DE UN PRODUCTO
// ==========================================

export const getReviewsByProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {

  try {

    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {

      res.status(400).json({
        error: 'ID de producto inválido.'
      });

      return;
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS user_name
      FROM reviews r
      LEFT JOIN users u
        ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      `,
      [productId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(
      'Error al obtener reviews:',
      error
    );

    res.status(500).json({
      error: 'Error al obtener las reviews.'
    });
  }
};


// ==========================================
// CREAR REVIEW
// ==========================================

export const createReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {

  try {

    const productId = Number(req.params.productId);

    const {
      rating,
      comment
    } = req.body;

    // ==========================================
    // USUARIO AUTENTICADO
    // ==========================================

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {

      res.status(401).json({
        error: 'Usuario no autenticado.'
      });

      return;
    }

    // ==========================================
    // LOS ADMINISTRADORES NO PUEDEN PUBLICAR
    // REVIEWS
    // ==========================================

    if (userRole === 'admin') {

      res.status(403).json({
        error: 'Los administradores no pueden publicar reviews.'
      });

      return;
    }

    // ==========================================
    // VALIDAR ID DE PRODUCTO
    // ==========================================

    if (!Number.isInteger(productId) || productId <= 0) {

      res.status(400).json({
        error: 'ID de producto inválido.'
      });

      return;
    }

    // ==========================================
    // VALIDAR RATING
    // ==========================================

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {

      res.status(400).json({
        error: 'La calificación debe ser un número entre 1 y 5.'
      });

      return;
    }

    // ==========================================
    // VALIDAR COMENTARIO
    // ==========================================

    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== 'string'
    ) {

      res.status(400).json({
        error: 'El comentario debe ser un texto.'
      });

      return;
    }

    // ==========================================
    // VERIFICAR PRODUCTO
    // ==========================================

    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
      `,
      [productId]
    );

    if (productResult.rows.length === 0) {

      res.status(404).json({
        error: 'Producto no encontrado.'
      });

      return;
    }

    // ==========================================
    // VERIFICAR SI YA DEJÓ UNA REVIEW
    // ==========================================

    const existingReview = await pool.query(
      `
      SELECT id
      FROM reviews
      WHERE product_id = $1
        AND user_id = $2
      `,
      [
        productId,
        userId
      ]
    );

    if (existingReview.rows.length > 0) {

      res.status(409).json({
        error: 'Ya has dejado una review para este producto.'
      });

      return;
    }

    // ==========================================
    // CREAR REVIEW
    // ==========================================

    const result = await pool.query(
      `
      INSERT INTO reviews (
        product_id,
        user_id,
        rating,
        comment
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        product_id,
        user_id,
        rating,
        comment,
        created_at
      `,
      [
        productId,
        userId,
        rating,
        typeof comment === 'string'
          ? comment.trim() || null
          : null
      ]
    );

    res.status(201).json({
      message: 'Review creada correctamente.',
      review: result.rows[0]
    });

  } catch (error) {

    console.error(
      'Error al crear review:',
      error
    );

    res.status(500).json({
      error: 'Error al crear la review.'
    });
  }
};


// ==========================================
// ELIMINAR REVIEW
// ==========================================

export const deleteReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {

  try {

    const reviewId = Number(req.params.id);

    const userId = req.user?.id;

    if (!userId) {

      res.status(401).json({
        error: 'Usuario no autenticado.'
      });

      return;
    }

    if (!Number.isInteger(reviewId) || reviewId <= 0) {

      res.status(400).json({
        error: 'ID de review inválido.'
      });

      return;
    }

    // ==========================================
    // ELIMINAR SOLO LA REVIEW DEL USUARIO
    // ==========================================

    const result = await pool.query(
      `
      DELETE FROM reviews
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [
        reviewId,
        userId
      ]
    );

    if (result.rows.length === 0) {

      res.status(404).json({
        error: 'Review no encontrada o no tienes permiso para eliminarla.'
      });

      return;
    }

    res.json({
      message: 'Review eliminada correctamente.'
    });

  } catch (error) {

    console.error(
      'Error al eliminar review:',
      error
    );

    res.status(500).json({
      error: 'Error al eliminar la review.'
    });
  }
};