import { Response } from 'express';

import { pool } from '../config/db';

import { AuthRequest } from '../middlewares/auth.middleware';


// =====================================================
// OBTENER FAVORITOS DEL USUARIO
// GET /api/favorites
// =====================================================

export async function getFavorites(
  req: AuthRequest,
  res: Response
) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado.'
      });
    }


    const query = `
      SELECT
        p.id,

        COALESCE(
          pt.name,
          p.name
        ) AS name,

        COALESCE(
          pt.description,
          p.description
        ) AS description,

        CAST(
          p.price AS FLOAT
        ) AS price,

        p.image_url AS "imageUrl",

        p.stock,

        COALESCE(
          pt.category,
          'General'
        ) AS category,

        5 AS rating,

        f.created_at AS "favoriteCreatedAt"

      FROM favorites f

      INNER JOIN products p
        ON p.id = f.product_id

      LEFT JOIN product_translations pt
        ON pt.product_id = p.id
        AND pt.locale = $2

      WHERE f.user_id = $1

      ORDER BY f.created_at DESC
    `;


    const requestedLocale =
      req.query.lang;

    const locale =
      requestedLocale === 'en'
        ? 'en'
        : 'es';


    const result =
      await pool.query(
        query,
        [
          userId,
          locale
        ]
      );


    return res.json(
      result.rows
    );

  } catch (error) {

    console.error(
      'Error al obtener favoritos:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}


// =====================================================
// AGREGAR PRODUCTO A FAVORITOS
// POST /api/favorites/:productId
// =====================================================

export async function addFavorite(
  req: AuthRequest,
  res: Response
) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado.'
      });
    }


    const productId =
      Number(req.params.productId);


    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        error:
          'ID de producto inválido.'
      });
    }


    // =================================================
    // VERIFICAR QUE EL PRODUCTO EXISTA
    // =================================================

    const productResult =
      await pool.query(
        `
          SELECT
            id
          FROM products
          WHERE id = $1
        `,
        [productId]
      );


    if (
      productResult.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          'Producto no encontrado.'
      });
    }


    // =================================================
    // AGREGAR FAVORITO
    // =================================================

    const result =
      await pool.query(
        `
          INSERT INTO favorites (
            user_id,
            product_id
          )
          VALUES (
            $1,
            $2
          )
          ON CONFLICT (
            user_id,
            product_id
          )
          DO NOTHING

          RETURNING
            id,
            user_id AS "userId",
            product_id AS "productId",
            created_at AS "createdAt"
        `,
        [
          userId,
          productId
        ]
      );


    // =================================================
    // YA EXISTÍA
    // =================================================

    if (
      result.rows.length === 0
    ) {

      return res.status(200).json({
        message:
          'El producto ya estaba en favoritos.',
        favorite: true
      });

    }


    return res.status(201).json({
      message:
        'Producto agregado a favoritos.',
      favorite: true,
      data:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      'Error al agregar favorito:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}


// =====================================================
// ELIMINAR PRODUCTO DE FAVORITOS
// DELETE /api/favorites/:productId
// =====================================================

export async function removeFavorite(
  req: AuthRequest,
  res: Response
) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado.'
      });
    }


    const productId =
      Number(req.params.productId);


    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        error:
          'ID de producto inválido.'
      });
    }


    const result =
      await pool.query(
        `
          DELETE FROM favorites

          WHERE user_id = $1
            AND product_id = $2

          RETURNING
            id,
            user_id AS "userId",
            product_id AS "productId"
        `,
        [
          userId,
          productId
        ]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'El producto no estaba en favoritos.',
        favorite: false
      });

    }


    return res.json({
      message:
        'Producto eliminado de favoritos.',
      favorite: false,
      data:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      'Error al eliminar favorito:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}


// =====================================================
// COMPROBAR SI UN PRODUCTO ES FAVORITO
// GET /api/favorites/check/:productId
// =====================================================

export async function checkFavorite(
  req: AuthRequest,
  res: Response
) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado.'
      });
    }


    const productId =
      Number(req.params.productId);


    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        error:
          'ID de producto inválido.'
      });
    }


    const result =
      await pool.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM favorites
            WHERE user_id = $1
              AND product_id = $2
          ) AS favorite
        `,
        [
          userId,
          productId
        ]
      );


    return res.json({
      favorite:
        result.rows[0].favorite
    });

  } catch (error) {

    console.error(
      'Error comprobando favorito:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}