import { Response } from 'express';
import { pool } from '../config/db';


// ==========================================
// OBTENER CARRITO
// ==========================================

export const getCart = async (
  req: any,
  res: Response
) => {

  try {

    const userId = req.user.id;


    const result = await pool.query(
      `
      SELECT
        ci.product_id AS id,
        p.name,
        p.description,
        CAST(p.price AS FLOAT) AS price,
        p.image_url AS "imageUrl",
        p.stock,
        ci.quantity

      FROM cart_items ci

      JOIN products p
        ON ci.product_id = p.id

      WHERE ci.user_id = $1
      `,
      [userId]
    );


    const formattedItems =
      result.rows.map((row) => ({

        product: {

          id: row.id,

          name: row.name,

          description:
            row.description,

          price:
            row.price,

          imageUrl:
            row.imageUrl,

          stock:
            row.stock

        },

        quantity:
          Math.min(
            row.quantity,
            row.stock
          )

      }));


    res.json(formattedItems);


  } catch (error) {

    console.error(
      '❌ ERROR REAL DEL CARRITO:',
      error
    );


    res.status(500).json({

      error:
        'Error interno del servidor'

    });

  }

};


// ==========================================
// GUARDAR / ACTUALIZAR ITEM
// ==========================================

export const saveCartItem = async (
  req: any,
  res: Response
) => {

  try {

    const userId =
      req.user.id;


    const {
      productId,
      quantity
    } = req.body;


    // ========================================
    // VALIDAR DATOS
    // ========================================

    if (
      !productId ||
      quantity === undefined
    ) {

      return res.status(400).json({

        error:
          'productId y quantity son obligatorios'

      });

    }


    // ========================================
    // ELIMINAR SI ES 0
    // ========================================

    if (quantity <= 0) {

      await pool.query(
        `
        DELETE FROM cart_items

        WHERE user_id = $1
        AND product_id = $2
        `,
        [
          userId,
          productId
        ]
      );


      return res.json({

        success: true,

        message:
          'Producto eliminado del carrito'

      });

    }


    // ========================================
    // OBTENER STOCK REAL
    // ========================================

    const productResult =
      await pool.query(
        `
        SELECT
          id,
          stock

        FROM products

        WHERE id = $1
        `,
        [productId]
      );


    // ========================================
    // PRODUCTO NO EXISTE
    // ========================================

    if (
      productResult.rows.length === 0
    ) {

      return res.status(404).json({

        error:
          'Producto no encontrado'

      });

    }


    const stock =
      productResult.rows[0].stock;


    // ========================================
    // SIN STOCK
    // ========================================

    if (stock <= 0) {

      return res.status(400).json({

        error:
          'Producto sin stock'

      });

    }


    // ========================================
    // CANTIDAD MAYOR AL STOCK
    // ========================================

    if (quantity > stock) {

      return res.status(400).json({

        error:
          `No hay suficiente stock. Stock disponible: ${stock}`

      });

    }


    // ========================================
    // GUARDAR / ACTUALIZAR
    // ========================================

    const result =
      await pool.query(
        `
        INSERT INTO cart_items (
          user_id,
          product_id,
          quantity,
          updated_at
        )

        VALUES (
          $1,
          $2,
          $3,
          NOW()
        )

        ON CONFLICT (
          user_id,
          product_id
        )

        DO UPDATE SET

          quantity =
            EXCLUDED.quantity,

          updated_at =
            NOW()

        RETURNING *
        `,
        [
          userId,
          productId,
          quantity
        ]
      );


    res.json({

      success: true,

      item:
        result.rows[0]

    });


  } catch (error) {

    console.error(
      '❌ ERROR AL GUARDAR CARRITO:',
      error
    );


    res.status(500).json({

      error:
        'Error interno del servidor'

    });

  }

};


// ==========================================
// ELIMINAR ITEM
// ==========================================

export const removeCartItem = async (
  req: any,
  res: Response
) => {

  try {

    const userId =
      req.user.id;

    const { id } =
      req.params;


    await pool.query(
      `
      DELETE FROM cart_items

      WHERE user_id = $1
      AND product_id = $2
      `,
      [
        userId,
        id
      ]
    );


    res.json({

      success: true,

      message:
        'Producto removido del carrito'

    });


  } catch (error) {

    console.error(
      '❌ ERROR AL ELIMINAR ÍTEM:',
      error
    );


    res.status(500).json({

      error:
        'Error interno del servidor'

    });

  }

};


// ==========================================
// VACIAR CARRITO
// ==========================================

export const clearCart = async (
  req: any,
  res: Response
) => {

  try {

    const userId =
      req.user.id;


    await pool.query(
      `
      DELETE FROM cart_items

      WHERE user_id = $1
      `,
      [userId]
    );


    res.json({

      success: true,

      message:
        'Carrito vaciado'

    });


  } catch (error) {

    console.error(
      '❌ ERROR AL VACIAR CARRITO:',
      error
    );


    res.status(500).json({

      error:
        'Error interno del servidor'

    });

  }

};