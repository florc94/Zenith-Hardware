import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail
} from '../services/email.service';

import {
  buildTrackCode
} from '../services/tracking.service';

import {
  createNotification
} from '../services/notifications.service';


// ============================================================
// GET /api/orders
// Soporta ?userId=, ?page= y ?limit= para paginación server-side
//
// Usuario normal:
// - siempre consulta sus propios pedidos usando req.user.id
// - ignora cualquier ?userId= enviado por el cliente
//
// Admin:
// - puede consultar todos los pedidos
// - puede filtrar por ?userId=
// ============================================================

export async function getOrders(
  req: AuthRequest,
  res: Response
) {
  const authenticatedUserId =
    req.user?.id?.toString();

  const requestedUserId =
    req.query.userId?.toString();

  const isAdmin =
    req.user?.role === 'admin';

  // ========================================================
  // DETERMINAR QUÉ USUARIO SE CONSULTA
  // ========================================================

  let userId: string | undefined;

  if (isAdmin) {

    // Admin:
    // si envía userId, filtra por ese usuario.
    // si no lo envía, obtiene todos los pedidos.
    userId =
      requestedUserId || undefined;

  } else {

    // Usuario normal:
    // SIEMPRE utiliza el ID obtenido del JWT.
    // Nunca confiamos en ?userId= enviado por el cliente.
    userId =
      authenticatedUserId;
  }

  // ========================================================
  // VALIDAR USUARIO AUTENTICADO
  // ========================================================

  if (!isAdmin && !authenticatedUserId) {

    return res.status(401).json({
      error:
        'Usuario no autenticado.'
    });
  }

  // ========================================================
  // PAGINACIÓN
  // ========================================================

  const page =
    parseInt(
      req.query.page as string
    ) || 1;

  const limit =
    parseInt(
      req.query.limit as string
    ) || 10;

  const offset =
    (page - 1) * limit;

  try {

    // ========================================================
    // 1. CONTAR TOTAL DE PEDIDOS
    // ========================================================

    let countQuery =
      'SELECT COUNT(*) FROM orders o';

    const countParams: any[] = [];

    if (userId) {

      countQuery +=
        ' WHERE o.user_id = $1';

      countParams.push(
        userId
      );
    }

    const countResult =
      await pool.query(
        countQuery,
        countParams
      );

    const totalItems =
      parseInt(
        countResult.rows[0].count,
        10
      );

    const totalPages =
      Math.ceil(
        totalItems / limit
      );

    // ========================================================
    // 2. OBTENER PEDIDOS
    // ========================================================

    let query = `
      SELECT
        o.id,

        o.user_id AS "userId",

        COALESCE(
          u.name,
          u.email,
          'Usuario #' || o.user_id,
          'Cliente'
        ) AS client,

        o.shipping_address AS "shippingAddress",

        CAST(
          o.subtotal AS FLOAT
        ),

        CAST(
          o.shipping_cost AS FLOAT
        ) AS "costoEnvio",

        CAST(
          o.total AS FLOAT
        ),

        CASE
          WHEN o.status = 'Completado'
            THEN 'paid'

          ELSE o.status
        END AS status,

        o.created_at AS "createdAt"

      FROM orders o

      LEFT JOIN users u
        ON CAST(o.user_id AS TEXT)
        = CAST(u.id AS TEXT)
    `;

    const params: any[] = [];

    let paramIndex = 1;

    if (userId) {

      query +=
        ` WHERE o.user_id = $${paramIndex}`;

      params.push(
        userId
      );

      paramIndex++;
    }

    query += `
      ORDER BY
        o.created_at DESC

      LIMIT
        $${paramIndex}

      OFFSET
        $${paramIndex + 1}
    `;

    params.push(
      limit,
      offset
    );

    const result =
      await pool.query(
        query,
        params
      );

    // ========================================================
    // 3. OBTENER ITEMS DE LOS PEDIDOS
    // ========================================================

    const orderIds =
      result.rows.map(
        (row) => row.id
      );

    let orderItems: any[] = [];

    if (orderIds.length > 0) {

      const itemsQuery = `
        SELECT
          oi.order_id,

          oi.product_id AS "productId",

          oi.quantity,

          CAST(
            oi.price AS FLOAT
          ) AS price,

          p.name AS name

        FROM order_items oi

        JOIN products p
          ON oi.product_id = p.id

        WHERE oi.order_id = ANY($1)
      `;

      const itemsResult =
        await pool.query(
          itemsQuery,
          [orderIds]
        );

      orderItems =
        itemsResult.rows;
    }

    // ========================================================
    // 4. ARMAR RESPUESTA
    // ========================================================

    const ordersWithDetails =
      result.rows.map(
        (row) => {

          const trackCode =
            buildTrackCode(
              row.id
            );

          const itemsForThisOrder =
            orderItems
              .filter(
                (item) =>
                  item.order_id === row.id
              )
              .map(
                (item) => ({
                  productId:
                    item.productId,

                  name:
                    item.name,

                  price:
                    item.price,

                  quantity:
                    item.quantity,

                  subtotal:
                    item.quantity *
                    item.price
                })
              );

          return {
            ...row,

            tracking:
              trackCode,

            trackingNumber:
              trackCode,

            orderTracking:
              trackCode,

            items:
              itemsForThisOrder
          };
        }
      );

    // ========================================================
    // 5. RESPUESTA
    // ========================================================

    res.json({

      data:
        ordersWithDetails,

      meta: {

        totalItems,

        totalPages,

        currentPage:
          page,

        itemsPerPage:
          limit
      }

    });

  } catch (error) {

    console.error(
      'Error al obtener pedidos paginados:',
      error
    );

    res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}


// ============================================================
// GET /api/orders/metrics
// ============================================================

export async function getOrdersMetrics(
  req: Request,
  res: Response
) {
  try {

    // ========================================================
    // PERÍODO DE VENTAS
    // ========================================================

    const requestedPeriod =
      String(
        req.query.period || '30d'
      );

    const validPeriods = [
      '7d',
      '30d',
      '3m',
      '12m'
    ];

    if (
      !validPeriods.includes(
        requestedPeriod
      )
    ) {

      return res.status(400).json({
        error:
          'Período inválido. Usá 7d, 30d, 3m o 12m.'
      });
    }


    // ========================================================
    // MÉTRICAS GENERALES
    // ========================================================

    const ordersQuery =
      await pool.query(`
        SELECT

          COUNT(*) as total_orders,

          COALESCE(
            SUM(total),
            0
          ) as total_revenue,

          COALESCE(
            AVG(total),
            0
          ) as avg_order_value,

          COALESCE(
            SUM(
              CASE
                WHEN created_at >=
                  CURRENT_DATE - INTERVAL '30 days'

                THEN total

                ELSE 0
              END
            ),
            0
          ) as this_month_revenue

        FROM orders
      `);


    // ========================================================
    // PEDIDOS POR ESTADO
    // ========================================================

    const statusQuery =
      await pool.query(`
        SELECT
          status,
          COUNT(*) as count

        FROM orders

        GROUP BY status
      `);


    const ordersByStatus: {
      [key: string]: number
    } = {

      paid: 0,

      processing: 0,

      shipped: 0,

      delivered: 0,

      cancelled: 0,

    };


    statusQuery.rows.forEach(
      (row: any) => {

        const st =
          row.status
            ? row.status
                .toLowerCase()
                .trim()
            : '';

        const count =
          parseInt(
            row.count,
            10
          );

        let targetKey =
          'paid';


        if (
          st === 'processing' ||
          st === 'en preparación' ||
          st === 'en preparacion'
        ) {

          targetKey =
            'processing';

        } else if (
          st === 'shipped' ||
          st === 'enviado'
        ) {

          targetKey =
            'shipped';

        } else if (
          st === 'delivered' ||
          st === 'entregado' ||
          st === 'completado'
        ) {

          targetKey =
            'delivered';

        } else if (
          st === 'cancelled' ||
          st === 'cancelado'
        ) {

          targetKey =
            'cancelled';
        }


        ordersByStatus[targetKey] =
          (
            ordersByStatus[targetKey] ||
            0
          ) + count;
      }
    );


    // ========================================================
    // VENTAS POR PERÍODO
    // ========================================================

    let salesQuery: string;

    if (
      requestedPeriod === '7d' ||
      requestedPeriod === '30d'
    ) {

      const days =
        requestedPeriod === '7d'
          ? 6
          : 29;

      salesQuery = `
        SELECT

          TO_CHAR(
            day,
            'YYYY-MM-DD'
          ) AS date,

          COALESCE(
            SUM(
              CASE
                WHEN LOWER(
                  TRIM(o.status)
                ) NOT IN (
                  'cancelled',
                  'cancelado'
                )
                THEN o.total

                ELSE 0
              END
            ),
            0
          ) AS revenue,

          COUNT(
            CASE
              WHEN LOWER(
                TRIM(o.status)
              ) NOT IN (
                'cancelled',
                'cancelado'
              )
              THEN o.id
            END
          ) AS orders

        FROM generate_series(
          CURRENT_DATE
          - INTERVAL '${days} days',

          CURRENT_DATE,

          INTERVAL '1 day'
        ) AS day

        LEFT JOIN orders o
          ON o.created_at >= day

          AND o.created_at <
            day + INTERVAL '1 day'

        GROUP BY day

        ORDER BY day
      `;

    } else {

      const months =
        requestedPeriod === '3m'
          ? 2
          : 11;

      salesQuery = `
        SELECT

          TO_CHAR(
            month,
            'YYYY-MM'
          ) AS date,

          COALESCE(
            SUM(
              CASE
                WHEN LOWER(
                  TRIM(o.status)
                ) NOT IN (
                  'cancelled',
                  'cancelado'
                )
                THEN o.total

                ELSE 0
              END
            ),
            0
          ) AS revenue,

          COUNT(
            CASE
              WHEN LOWER(
                TRIM(o.status)
              ) NOT IN (
                'cancelled',
                'cancelado'
              )
              THEN o.id
            END
          ) AS orders

        FROM generate_series(
          DATE_TRUNC(
            'month',
            CURRENT_DATE
            - INTERVAL '${months} months'
          ),

          DATE_TRUNC(
            'month',
            CURRENT_DATE
          ),

          INTERVAL '1 month'
        ) AS month

        LEFT JOIN orders o
          ON o.created_at >= month

          AND o.created_at <
            month + INTERVAL '1 month'

        GROUP BY month

        ORDER BY month
      `;
    }


    const salesQueryResult =
      await pool.query(
        salesQuery
      );


    const salesByPeriod =
      salesQueryResult.rows.map(
        (item: any) => ({

          date:
            item.date,

          revenue:
            parseFloat(
              item.revenue
            ) || 0,

          orders:
            parseInt(
              item.orders,
              10
            ) || 0

        })
      );


    // ========================================================
    // RESPUESTA
    // ========================================================

    const row =
      ordersQuery.rows[0];


    res.json({

      totalOrders:
        parseInt(
          row.total_orders,
          10
        ) || 0,

      totalRevenue:
        parseFloat(
          row.total_revenue
        ) || 0,

      thisMonthRevenue:
        parseFloat(
          row.this_month_revenue
        ) || 0,

      avgOrderValue:
        parseFloat(
          row.avg_order_value
        ) || 0,

      avgDeliveryTimeHours:
        72,

      ordersByStatus,

      topProducts: [],

      salesByPeriod

    });

  } catch (error: any) {

    console.error(
      '❌ Error detallado en métricas:',
      error
    );

    res.status(500).json({

      error:
        'Error interno del servidor',

      details:
        error.message

    });
  }
}


// ============================================================
// GET /api/orders/metrics/sales
// Ventas agrupadas por período
// ============================================================

export async function getSalesByPeriod(
  req: Request,
  res: Response
) {
  const period =
    String(
      req.query.period || '30d'
    );


  // ========================================================
  // VALIDAR PERÍODO
  // ========================================================

  const validPeriods = [
    '7d',
    '30d',
    '3m',
    '12m'
  ];


  if (
    !validPeriods.includes(
      period
    )
  ) {

    return res.status(400).json({

      error:
        'Período inválido. Usá 7d, 30d, 3m o 12m.',

      validPeriods

    });
  }


  try {

    // ======================================================
    // CONFIGURACIÓN
    // ======================================================

    let startDateExpression: string;

    let bucketExpression: string;

    let seriesStartExpression: string;

    let seriesEndExpression: string;

    let intervalExpression: string;


    // ======================================================
    // 7 DÍAS
    // ======================================================

    if (
      period === '7d'
    ) {

      startDateExpression =
        `CURRENT_DATE - INTERVAL '6 days'`;

      bucketExpression =
        `o.created_at::date`;

      seriesStartExpression =
        `CURRENT_DATE - INTERVAL '6 days'`;

      seriesEndExpression =
        `CURRENT_DATE`;

      intervalExpression =
        `INTERVAL '1 day'`;
    }


    // ======================================================
    // 30 DÍAS
    // ======================================================

    else if (
      period === '30d'
    ) {

      startDateExpression =
        `CURRENT_DATE - INTERVAL '29 days'`;

      bucketExpression =
        `o.created_at::date`;

      seriesStartExpression =
        `CURRENT_DATE - INTERVAL '29 days'`;

      seriesEndExpression =
        `CURRENT_DATE`;

      intervalExpression =
        `INTERVAL '1 day'`;
    }


    // ======================================================
    // 3 MESES
    // ======================================================

    else if (
      period === '3m'
    ) {

      startDateExpression =
        `date_trunc(
          'week',
          CURRENT_DATE
        ) - INTERVAL '11 weeks'`;

      bucketExpression =
        `date_trunc(
          'week',
          o.created_at
        )`;

      seriesStartExpression =
        `date_trunc(
          'week',
          CURRENT_DATE
        ) - INTERVAL '11 weeks'`;

      seriesEndExpression =
        `date_trunc(
          'week',
          CURRENT_DATE
        )`;

      intervalExpression =
        `INTERVAL '1 week'`;
    }


    // ======================================================
    // 12 MESES
    // ======================================================

    else {

      startDateExpression =
        `date_trunc(
          'month',
          CURRENT_DATE
        ) - INTERVAL '11 months'`;

      bucketExpression =
        `date_trunc(
          'month',
          o.created_at
        )`;

      seriesStartExpression =
        `date_trunc(
          'month',
          CURRENT_DATE
        ) - INTERVAL '11 months'`;

      seriesEndExpression =
        `date_trunc(
          'month',
          CURRENT_DATE
        )`;

      intervalExpression =
        `INTERVAL '1 month'`;
    }


    // ======================================================
    // CONSULTA
    // ======================================================

    const query = `
      WITH series AS (

        SELECT generate_series(
          ${seriesStartExpression},
          ${seriesEndExpression},
          ${intervalExpression}
        ) AS bucket

      ),

      sales AS (

        SELECT

          ${bucketExpression} AS bucket,

          COALESCE(
            SUM(o.total),
            0
          ) AS revenue,

          COUNT(o.id)::INTEGER AS orders

        FROM orders o

        WHERE

          o.created_at >=
            ${startDateExpression}

          AND LOWER(
            TRIM(o.status)
          ) NOT IN (
            'cancelled',
            'cancelado'
          )

        GROUP BY
          ${bucketExpression}
      )

      SELECT

        series.bucket,

        COALESCE(
          sales.revenue,
          0
        ) AS revenue,

        COALESCE(
          sales.orders,
          0
        ) AS orders

      FROM series

      LEFT JOIN sales
        ON sales.bucket =
          series.bucket

      ORDER BY
        series.bucket ASC
    `;


    const result =
      await pool.query(
        query
      );


    // ======================================================
    // FORMATEADORES
    // ======================================================

    const formatterDay =
      new Intl.DateTimeFormat(
        'es-AR',
        {
          day: '2-digit',
          month: '2-digit'
        }
      );


    const formatterMonth =
      new Intl.DateTimeFormat(
        'es-AR',
        {
          month: 'short',
          year: 'numeric'
        }
      );


    // ======================================================
    // PUNTOS
    // ======================================================

    const points =
      result.rows.map(
        (row: any) => {

          const bucket =
            new Date(
              row.bucket
            );


          let label: string;


          if (
            period === '7d' ||
            period === '30d'
          ) {

            label =
              formatterDay.format(
                bucket
              );

          }


          else if (
            period === '3m'
          ) {

            label =
              `Sem. ${
                formatterDay.format(
                  bucket
                )
              }`;

          }


          else {

            label =
              formatterMonth
                .format(bucket)
                .replace('.', '');
          }


          return {

            date:
              bucket.toISOString(),

            label,

            revenue:
              Number(
                row.revenue
              ) || 0,

            orders:
              Number(
                row.orders
              ) || 0

          };
        }
      );


    // ======================================================
    // TOTALES
    // ======================================================

    const totalRevenue =
      points.reduce(
        (
          total: number,
          point: {
            revenue: number;
            orders: number;
          }
        ) =>
          total +
          point.revenue,
        0
      );


    const totalOrders =
      points.reduce(
        (
          total: number,
          point: {
            revenue: number;
            orders: number;
          }
        ) =>
          total +
          point.orders,
        0
      );


    // ======================================================
    // RESPUESTA
    // ======================================================

    res.json({

      period,

      totalRevenue,

      totalOrders,

      points

    });

  }

  catch (error: any) {

    console.error(
      '❌ Error al obtener ventas por período:',
      error
    );


    res.status(500).json({

      error:
        'Error interno del servidor',

      details:
        error.message

    });
  }
}


// ============================================================
// GET /api/orders/:id
// ============================================================

export async function getOrderById(
  req: Request,
  res: Response
) {
  const { id } =
    req.params;

  try {

    const orderQuery = `
      SELECT

        o.id,

        o.user_id AS "userId",

        COALESCE(
          u.name,
          u.email,
          'Usuario #' || o.user_id,
          'Cliente'
        ) AS client,

        o.shipping_address AS "shippingAddress",

        CAST(
          o.subtotal AS FLOAT
        ),

        CAST(
          o.shipping_cost AS FLOAT
        ) AS "costoEnvio",

        CAST(
          o.total AS FLOAT
        ),

        CASE
          WHEN o.status = 'Completado'
            THEN 'paid'

          ELSE o.status
        END AS status,

        o.created_at AS "createdAt"

      FROM orders o

      LEFT JOIN users u
        ON CAST(o.user_id AS TEXT)
        = CAST(u.id AS TEXT)

      WHERE o.id = $1
    `;


    const orderResult =
      await pool.query(
        orderQuery,
        [id]
      );


    if (
      orderResult.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Pedido no encontrado'
      });
    }


    const row =
      orderResult.rows[0];


    const itemsQuery = `
      SELECT

        oi.product_id AS "productId",

        oi.quantity,

        CAST(
          oi.price AS FLOAT
        ) AS price,

        p.name AS "p_name"

      FROM order_items oi

      JOIN products p
        ON oi.product_id = p.id

      WHERE oi.order_id = $1
    `;


    const itemsResult =
      await pool.query(
        itemsQuery,
        [id]
      );


    const trackCode =
      buildTrackCode(
        row.id
      );


    const order = {

      id:
        row.id,

      userId:
        row.userId,

      client:
        row.client,

      tracking:
        trackCode,

      trackingNumber:
        trackCode,

      orderTracking:
        trackCode,

      shippingAddress:
        row.shippingAddress,

      subtotal:
        row.subtotal,

      costoEnvio:
        row.costoEnvio,

      total:
        row.total,

      status:
        row.status,

      createdAt:
        row.createdAt,

      items:
        itemsResult.rows.map(
          (item: any) => ({

            productId:
              item.productId,

            name:
              item.p_name,

            price:
              item.price,

            quantity:
              item.quantity,

            subtotal:
              item.quantity *
              item.price

          })
        )

    };


    res.json(order);

  } catch (error) {

    console.error(
      'Error al obtener el detalle del pedido:',
      error
    );

    res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}


// ============================================================
// POST /api/orders
// Checkout:
// crea pedido,
// descuenta stock,
// vacía carrito,
// envía email de confirmación
// y crea notificación
// ============================================================

export async function createOrder(
  req: AuthRequest,
  res: Response
) {

  const {
    shippingAddress,
    subtotal,
    costoEnvio,
    total
  } = req.body;


  const userId =
    req.user?.id;


  if (!userId) {

    return res.status(401).json({
      error:
        'Usuario no autenticado.'
    });
  }


  const client =
    await pool.connect();


  try {

    await client.query(
      'BEGIN'
    );


    // ========================================================
    // 1. OBTENER DATOS DEL USUARIO
    // ========================================================

    const userResult =
      await client.query(
        `
        SELECT
          name,
          email

        FROM users

        WHERE id = $1
        `,
        [userId]
      );


    if (
      userResult.rows.length === 0
    ) {

      await client.query(
        'ROLLBACK'
      );

      return res.status(404).json({
        error:
          'Usuario no encontrado.'
      });
    }


    const user =
      userResult.rows[0];


    // ========================================================
    // 2. CREAR ORDEN
    // ========================================================

    const orderResult =
      await client.query(
        `
        INSERT INTO orders (
          user_id,
          shipping_address,
          subtotal,
          shipping_cost,
          total,
          status,
          status_updated_at
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'paid',
          CURRENT_TIMESTAMP
        )

        RETURNING

          id,

          status,

          created_at AS "createdAt"
        `,
        [
          userId,
          shippingAddress,
          subtotal,
          costoEnvio,
          total
        ]
      );


    const newOrder =
      orderResult.rows[0];


    // ========================================================
    // 3. OBTENER PRODUCTOS DEL CARRITO
    // ========================================================

    const itemsResult =
      await client.query(
        `
        SELECT

          p.name,

          c.quantity,

          CAST(
            p.price AS FLOAT
          ) AS price,

          CAST(
            c.quantity * p.price
            AS FLOAT
          ) AS subtotal

        FROM cart_items c

        JOIN products p
          ON c.product_id = p.id

        WHERE c.user_id = $1
        `,
        [userId]
      );


    // ========================================================
    // 4. COPIAR CARRITO A ORDER_ITEMS
    // ========================================================

    await client.query(
      `
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price
      )

      SELECT

        $1,

        c.product_id,

        c.quantity,

        p.price

      FROM cart_items c

      JOIN products p
        ON c.product_id = p.id

      WHERE c.user_id = $2
      `,
      [
        newOrder.id,
        userId
      ]
    );


    // ========================================================
    // 5. DESCONTAR STOCK
    // ========================================================

    await client.query(
      `
      UPDATE products p

      SET
        stock =
          p.stock - c.quantity

      FROM cart_items c

      WHERE
        c.product_id = p.id

        AND c.user_id = $1
      `,
      [userId]
    );


    // ========================================================
    // 6. VACIAR CARRITO
    // ========================================================

    await client.query(
      `
      DELETE FROM cart_items

      WHERE user_id = $1
      `,
      [userId]
    );


    // ========================================================
    // 7. CONFIRMAR TRANSACCIÓN
    // ========================================================

    await client.query(
      'COMMIT'
    );


    // ========================================================
    // 8. GENERAR TRACKING
    // ========================================================

    const trackCode =
      buildTrackCode(
        newOrder.id
      );


    // ========================================================
    // 9. CREAR NOTIFICACIÓN
    // ========================================================

    try {

      await createNotification({

        userId:
          Number(userId),

        type:
          'order_confirmed',

        title:
          'Compra confirmada',

        message:
          `Tu pedido #${newOrder.id} fue confirmado correctamente.`,

        orderId:
          newOrder.id

      });

      console.log(
        `🔔 Notificación de compra confirmada creada para el pedido #${newOrder.id}`
      );

    } catch (notificationError) {

      console.error(
        '⚠️ Pedido creado correctamente, pero falló la notificación:',
        notificationError
      );
    }


    // ========================================================
    // 10. ENVIAR EMAIL
    // ========================================================

    try {

      await sendOrderConfirmationEmail({

        orderId:
          newOrder.id,

        customerName:
          user.name ||
          'Cliente',

        customerEmail:
          user.email,

        items:
          itemsResult.rows,

        subtotal:
          Number(subtotal) || 0,

        shippingCost:
          Number(costoEnvio) || 0,

        total:
          Number(total) || 0,

        shippingAddress,

        trackingNumber:
          trackCode

      });

    } catch (emailError) {

      console.error(
        '⚠️ Pedido creado correctamente, pero falló el email:',
        emailError
      );
    }


    // ========================================================
    // 11. RESPUESTA
    // ========================================================

    res.json({

      id:
        newOrder.id,

      userId,

      shippingAddress,

      subtotal,

      costoEnvio,

      total,

      status:
        newOrder.status,

      tracking:
        trackCode,

      trackingNumber:
        trackCode,

      orderTracking:
        trackCode,

      createdAt:
        newOrder.createdAt

    });

  } catch (error) {

    await client.query(
      'ROLLBACK'
    );


    console.error(
      'Error al finalizar la compra:',
      error
    );


    res.status(500).json({
      error:
        'Error al procesar la compra'
    });

  } finally {

    client.release();
  }
}


// ============================================================
// PATCH /api/orders/:id/status
// Actualiza el estado del pedido,
// crea notificación
// y envía email cuando pasa a enviado
// ============================================================

export async function updateOrderStatus(
  req: Request,
  res: Response
) {

  const { id } =
    req.params;

  const { status } =
    req.body;


  try {

    // ========================================================
    // 1. ACTUALIZAR ESTADO
    // ========================================================

    const updateQuery = `
      UPDATE orders

      SET

        status = $1,

        status_updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING
        id,
        user_id AS "userId",
        status
    `;


    const result =
      await pool.query(
        updateQuery,
        [
          status,
          id
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


    const updatedOrder =
      result.rows[0];


    // ========================================================
    // 2. CREAR NOTIFICACIÓN
    // ========================================================

    const normalizedStatus =
      String(status)
        .toLowerCase()
        .trim();


    let notificationType:
      string | null = null;

    let notificationTitle:
      string | null = null;

    let notificationMessage:
      string | null = null;


    if (
      normalizedStatus === 'processing' ||
      normalizedStatus === 'en preparación' ||
      normalizedStatus === 'en preparacion'
    ) {

      notificationType =
        'order_processing';

      notificationTitle =
        'Pedido en preparación';

      notificationMessage =
        `Tu pedido #${updatedOrder.id} ya está siendo preparado.`;

    } else if (
      normalizedStatus === 'shipped' ||
      normalizedStatus === 'enviado'
    ) {

      notificationType =
        'order_shipped';

      notificationTitle =
        'Pedido enviado';

      notificationMessage =
        `Tu pedido #${updatedOrder.id} fue enviado y está en camino.`;

    } else if (
      normalizedStatus === 'delivered' ||
      normalizedStatus === 'entregado' ||
      normalizedStatus === 'completado'
    ) {

      notificationType =
        'order_delivered';

      notificationTitle =
        'Pedido entregado';

      notificationMessage =
        `Tu pedido #${updatedOrder.id} fue entregado correctamente.`;

    } else if (
      normalizedStatus === 'cancelled' ||
      normalizedStatus === 'cancelado'
    ) {

      notificationType =
        'order_cancelled';

      notificationTitle =
        'Pedido cancelado';

      notificationMessage =
        `Tu pedido #${updatedOrder.id} fue cancelado.`;
    }


    if (
      notificationType &&
      notificationTitle &&
      notificationMessage &&
      updatedOrder.userId
    ) {

      try {

        await createNotification({

          userId:
            Number(
              updatedOrder.userId
            ),

          type:
            notificationType,

          title:
            notificationTitle,

          message:
            notificationMessage,

          orderId:
            updatedOrder.id

        });

        console.log(
          `🔔 Notificación "${notificationType}" creada para el pedido #${updatedOrder.id}`
        );

      } catch (notificationError) {

        console.error(
          `⚠️ Pedido #${updatedOrder.id} actualizado, pero falló la notificación:`,
          notificationError
        );
      }
    }


    // ========================================================
    // 3. SI EL PEDIDO FUE ENVIADO
    // ========================================================

    if (
      normalizedStatus === 'shipped'
    ) {

      try {

        const orderQuery = `
          SELECT

            o.id,

            o.shipping_address AS "shippingAddress",

            u.name AS "customerName",

            u.email AS "customerEmail"

          FROM orders o

          JOIN users u
            ON u.id = o.user_id

          WHERE o.id = $1
        `;


        const orderResult =
          await pool.query(
            orderQuery,
            [id]
          );


        if (
          orderResult.rows.length > 0
        ) {

          const order =
            orderResult.rows[0];


          const trackingNumber =
            buildTrackCode(
              order.id
            );


          await sendOrderShippedEmail({

            orderId:
              order.id,

            customerName:
              order.customerName ||
              'Cliente',

            customerEmail:
              order.customerEmail,

            shippingAddress:
              order.shippingAddress,

            trackingNumber

          });


          console.log(
            `📦 Email de envío enviado para el pedido #${order.id}`
          );
        }

      } catch (emailError) {

        console.error(
          '⚠️ El pedido fue marcado como enviado, pero falló el email:',
          emailError
        );
      }
    }


    // ========================================================
    // 4. RESPUESTA
    // ========================================================

    res.json(
      updatedOrder
    );


  } catch (error) {

    console.error(
      'Error al actualizar el estado del pedido:',
      error
    );


    res.status(500).json({
      error:
        'Error interno del servidor'
    });
  }
}