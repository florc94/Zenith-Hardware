import cron from 'node-cron';
import { pool } from '../config/db';

import {
  sendOrderShippedEmail
} from '../services/email.service';

import {
  buildTrackCode
} from '../services/tracking.service';

import {
  createNotification
} from '../services/notifications.service';


// ============================================================
// TIEMPOS DE AUTO-AVANCE
// ============================================================

const STATUS_DELAYS_MINUTES = {
  paid: 1,
  processing: 2,
  shipped: 3,
} as const;


// ============================================================
// SIGUIENTE ESTADO
// ============================================================

const NEXT_STATUS = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
} as const;


// ============================================================
// AUTO-AVANZAR PEDIDOS
// ============================================================

async function advanceOrders(): Promise<void> {

  try {

    for (
      const [
        currentStatus,
        delayMinutes
      ] of Object.entries(
        STATUS_DELAYS_MINUTES
      )
    ) {

      const nextStatus =
        NEXT_STATUS[
          currentStatus as keyof typeof NEXT_STATUS
        ];


      // ========================================================
      // ACTUALIZAR ESTADO
      // ========================================================

      const result =
        await pool.query(
          `
          UPDATE orders

          SET

            status = $1,

            status_updated_at =
              CURRENT_TIMESTAMP

          WHERE

            status = $2

            AND status_updated_at <=
              CURRENT_TIMESTAMP -
              ($3 * INTERVAL '1 minute')

          RETURNING
            id,
            user_id AS "userId",
            status
          `,
          [
            nextStatus,
            currentStatus,
            delayMinutes
          ]
        );


      // ========================================================
      // PROCESAR PEDIDOS ACTUALIZADOS
      // ========================================================

      if (
        result.rowCount &&
        result.rowCount > 0
      ) {

        for (
          const order
          of result.rows
        ) {

          console.log(
            `🔄 Pedido #${order.id} auto-avanzado a "${order.status}"`
          );


          // ====================================================
          // CREAR NOTIFICACIÓN
          // ====================================================

          try {

            if (
              order.status === 'processing'
            ) {

              await createNotification({

                userId:
                  Number(
                    order.userId
                  ),

                type:
                  'order_processing',

                title:
                  'Pedido en preparación',

                message:
                  `Tu pedido #${order.id} ya está siendo preparado.`,

                orderId:
                  order.id

              });


              console.log(
                `🔔 Notificación "Pedido en preparación" creada para el pedido #${order.id}`
              );

            } else if (
              order.status === 'shipped'
            ) {

              await createNotification({

                userId:
                  Number(
                    order.userId
                  ),

                type:
                  'order_shipped',

                title:
                  'Pedido enviado',

                message:
                  `Tu pedido #${order.id} fue enviado y está en camino.`,

                orderId:
                  order.id

              });


              console.log(
                `🔔 Notificación "Pedido enviado" creada para el pedido #${order.id}`
              );

            } else if (
              order.status === 'delivered'
            ) {

              await createNotification({

                userId:
                  Number(
                    order.userId
                  ),

                type:
                  'order_delivered',

                title:
                  'Pedido entregado',

                message:
                  `Tu pedido #${order.id} fue entregado correctamente.`,

                orderId:
                  order.id

              });


              console.log(
                `🔔 Notificación "Pedido entregado" creada para el pedido #${order.id}`
              );
            }

          } catch (notificationError) {

            /*
             * El pedido ya fue actualizado.
             *
             * Si la notificación falla,
             * NO revertimos el estado.
             */

            console.error(
              `⚠️ Pedido #${order.id} auto-avanzado a "${order.status}", pero falló la notificación:`,
              notificationError
            );
          }


          // ====================================================
          // EMAIL CUANDO PASA A SHIPPED
          // ====================================================

          if (
            order.status === 'shipped'
          ) {

            try {

              // ==================================================
              // OBTENER DATOS DEL PEDIDO Y CLIENTE
              // ==================================================

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
                  [order.id]
                );


              if (
                orderResult.rows.length === 0
              ) {

                console.error(
                  `⚠️ No se encontraron los datos del pedido #${order.id}`
                );

                continue;
              }


              const orderData =
                orderResult.rows[0];


              // ==================================================
              // GENERAR CÓDIGO DE SEGUIMIENTO
              // ==================================================

              const trackingNumber =
                buildTrackCode(
                  orderData.id
                );


              // ==================================================
              // ENVIAR EMAIL
              // ==================================================

              await sendOrderShippedEmail({

                orderId:
                  orderData.id,

                customerName:
                  orderData.customerName ||
                  'Cliente',

                customerEmail:
                  orderData.customerEmail,

                shippingAddress:
                  orderData.shippingAddress,

                trackingNumber

              });


              console.log(
                `📦 Email de envío enviado para el pedido #${orderData.id}`
              );

            } catch (emailError) {

              /*
               * El pedido ya fue enviado.
               *
               * Si Resend falla,
               * NO revertimos el estado.
               */

              console.error(
                `⚠️ El pedido #${order.id} fue auto-avanzado a "shipped", pero falló el email:`,
                emailError
              );
            }
          }

        }
      }
    }

  } catch (error) {

    console.error(
      '❌ Error en el auto-avance de pedidos:',
      error
    );
  }
}


// ============================================================
// INICIAR JOB
// ============================================================

export function startOrderAutoAdvanceJob(): void {

  console.log(
    '⏱️ Job de auto-avance de pedidos iniciado'
  );


  // ==========================================================
  // EJECUTAR CADA MINUTO
  // ==========================================================

  cron.schedule(
    '* * * * *',
    async () => {

      await advanceOrders();

    }
  );
}