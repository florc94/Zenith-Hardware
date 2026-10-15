import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const STORE_NAME = 'ZenithHardware';

// ============================================================
// TIPOS
// ============================================================

interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  trackingNumber: string;
}

interface OrderShippedEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  trackingNumber: string;
}

// ============================================================
// UTILIDADES
// ============================================================

function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSender(): string {
  return process.env.MAIL_FROM || `${STORE_NAME} <onboarding@resend.dev>`;
}

// ============================================================
// EMAIL DE VERIFICACIÓN DE CUENTA
// ============================================================

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<void> {
  const safeName = escapeEmailHtml(name);
  const safeUrl = escapeEmailHtml(verificationUrl);

  const { error } = await resend.emails.send({
    from: getSender(),
    to: [email],
    subject: `Verificá tu cuenta de ${STORE_NAME}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificá tu cuenta</title>
        </head>

        <body style="
          margin: 0;
          padding: 30px 12px;
          background: #08090f;
          font-family: Arial, sans-serif;
          color: #222222;
        ">
          <div style="
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
          ">
            <header style="
              padding: 28px;
              background: #11131c;
              text-align: center;
            ">
              <h1 style="margin: 0; color: #39ff8f; font-size: 28px;">
                ${STORE_NAME}
              </h1>
            </header>

            <main style="padding: 30px">
              <h2 style="color: #11131c">
                ¡Hola, ${safeName}!
              </h2>

              <p style="line-height: 1.7; color: #555555;">
                Gracias por crear tu cuenta en ${STORE_NAME}.
                Para confirmar tu dirección de correo electrónico,
                hacé clic en el siguiente botón.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a
                  href="${safeUrl}"
                  style="
                    display: inline-block;
                    padding: 14px 24px;
                    background: #39ff8f;
                    color: #08090f;
                    font-weight: bold;
                    text-decoration: none;
                    border-radius: 7px;
                  "
                >
                  Verificar mi cuenta
                </a>
              </div>

              <p style="line-height: 1.6; color: #666666; font-size: 14px;">
                Este enlace vence en 24 horas.
                Si no creaste esta cuenta, podés ignorar este mensaje.
              </p>
            </main>

            <footer style="
              padding: 18px;
              background: #11131c;
              color: #aab0c6;
              text-align: center;
              font-size: 12px;
            ">
              © ${new Date().getFullYear()} ${STORE_NAME}
            </footer>
          </div>
        </body>
      </html>
    `
  });

  if (error) {
    console.error('Error enviando email de verificación:', error);
    throw new Error('No se pudo enviar el email de verificación.');
  }

  console.log(`Email de verificación enviado a ${email}`);
}

// ============================================================
// EMAIL DE CONFIRMACIÓN DE COMPRA
// ============================================================

export async function sendOrderConfirmationEmail(
  order: OrderEmailData
): Promise<void> {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            ${escapeEmailHtml(item.name)}
          </td>

          <td style="
            padding: 10px;
            border-bottom: 1px solid #eeeeee;
            text-align: center;
          ">
            ${item.quantity}
          </td>

          <td style="
            padding: 10px;
            border-bottom: 1px solid #eeeeee;
            text-align: right;
          ">
            $${item.subtotal.toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  try {
    const { error } = await resend.emails.send({
      from: getSender(),
      to: [order.customerEmail],
      subject: `Confirmación de compra #${order.orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmación de compra</title>
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background: #08090f;
            font-family: Arial, sans-serif;
            color: #222222;
          ">
            <div style="
              max-width: 650px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
            ">
              <div style="
                padding: 30px;
                background: #11131c;
                color: #ffffff;
                text-align: center;
              ">
                <h1 style="margin: 0; color: #39ff8f; font-size: 28px;">
                  ${STORE_NAME}
                </h1>

                <p style="margin: 10px 0 0; color: #aab0c6;">
                  Confirmación de compra
                </p>
              </div>

              <div style="padding: 30px">
                <h2 style="margin-top: 0; color: #11131c;">
                  ¡Gracias por tu compra,
                  ${escapeEmailHtml(order.customerName)}!
                </h2>

                <p style="color: #555555; line-height: 1.6;">
                  Recibimos correctamente tu pedido.
                  A continuación encontrás el detalle de tu compra.
                </p>

                <div style="
                  margin: 25px 0;
                  padding: 18px;
                  background: #f5f6f8;
                  border-radius: 8px;
                ">
                  <p style="margin: 5px 0">
                    <strong>Pedido:</strong> #${order.orderId}
                  </p>

                  <p style="margin: 5px 0">
                    <strong>Seguimiento:</strong>
                    ${escapeEmailHtml(order.trackingNumber)}
                  </p>

                  <p style="margin: 5px 0">
                    <strong>Dirección:</strong>
                    ${escapeEmailHtml(order.shippingAddress)}
                  </p>
                </div>

                <h3 style="color: #11131c">Productos</h3>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse: collapse"
                >
                  <thead>
                    <tr style="background: #11131c; color: #ffffff;">
                      <th style="padding: 10px; text-align: left;">
                        Producto
                      </th>
                      <th style="padding: 10px; text-align: center;">
                        Cant.
                      </th>
                      <th style="padding: 10px; text-align: right;">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div style="
                  margin-top: 25px;
                  padding-top: 20px;
                  border-top: 1px solid #eeeeee;
                ">
                  <p style="margin: 8px 0; text-align: right;">
                    Subtotal:
                    <strong>$${order.subtotal.toFixed(2)}</strong>
                  </p>

                  <p style="margin: 8px 0; text-align: right;">
                    Envío:
                    <strong>$${order.shippingCost.toFixed(2)}</strong>
                  </p>

                  <p style="margin: 15px 0 0; text-align: right; font-size: 20px;">
                    Total:
                    <strong style="color: #16a765">
                      $${order.total.toFixed(2)}
                    </strong>
                  </p>
                </div>

                <p style="margin-top: 30px; color: #666666; line-height: 1.6;">
                  Te enviaremos otro email cuando tu pedido sea enviado.
                </p>
              </div>

              <div style="
                padding: 20px;
                background: #11131c;
                color: #aab0c6;
                text-align: center;
                font-size: 12px;
              ">
                © ${new Date().getFullYear()} ${STORE_NAME}
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error de Resend:', error);
      throw new Error('No se pudo enviar el email de confirmación.');
    }

    console.log(
      `Email de confirmación enviado para el pedido #${order.orderId}`
    );
  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    throw error;
  }
}

// ============================================================
// EMAIL DE PEDIDO ENVIADO
// ============================================================

export async function sendOrderShippedEmail(
  order: OrderShippedEmailData
): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: getSender(),
      to: [order.customerEmail],
      subject: `Tu pedido #${order.orderId} fue enviado`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pedido enviado</title>
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background: #08090f;
            font-family: Arial, sans-serif;
            color: #222222;
          ">
            <div style="
              max-width: 650px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
            ">
              <div style="
                padding: 30px;
                background: #11131c;
                color: #ffffff;
                text-align: center;
              ">
                <h1 style="margin: 0; color: #39ff8f; font-size: 28px;">
                  ${STORE_NAME}
                </h1>

                <p style="margin: 10px 0 0; color: #aab0c6;">
                  Pedido enviado
                </p>
              </div>

              <div style="padding: 30px">
                <h2 style="margin-top: 0; color: #11131c;">
                  ¡Tu pedido está en camino,
                  ${escapeEmailHtml(order.customerName)}!
                </h2>

                <p style="color: #555555; line-height: 1.6;">
                  Tu pedido fue enviado correctamente y ya está en camino
                  hacia la dirección indicada.
                </p>

                <div style="
                  margin: 25px 0;
                  padding: 20px;
                  background: #f5f6f8;
                  border-radius: 8px;
                ">
                  <p style="margin: 8px 0">
                    <strong>Pedido:</strong> #${order.orderId}
                  </p>

                  <p style="margin: 8px 0">
                    <strong>Número de seguimiento:</strong>
                    ${escapeEmailHtml(order.trackingNumber)}
                  </p>

                  <p style="margin: 8px 0">
                    <strong>Dirección de entrega:</strong>
                    ${escapeEmailHtml(order.shippingAddress)}
                  </p>
                </div>

                <div style="
                  margin: 30px 0;
                  padding: 25px;
                  background: #11131c;
                  border-radius: 10px;
                  text-align: center;
                ">
                  <p style="margin: 0 0 10px; color: #aab0c6;">
                    Número de seguimiento
                  </p>

                  <p style="
                    margin: 0;
                    color: #39ff8f;
                    font-size: 22px;
                    font-weight: bold;
                    letter-spacing: 2px;
                  ">
                    ${escapeEmailHtml(order.trackingNumber)}
                  </p>
                </div>

                <p style="margin-top: 30px; color: #666666; line-height: 1.6;">
                  Podés consultar el estado de tu pedido desde la sección
                  de pedidos de ${STORE_NAME}.
                </p>
              </div>

              <div style="
                padding: 20px;
                background: #11131c;
                color: #aab0c6;
                text-align: center;
                font-size: 12px;
              ">
                © ${new Date().getFullYear()} ${STORE_NAME}
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error de Resend al enviar email de envío:', error);
      throw new Error('No se pudo enviar el email de pedido enviado.');
    }

    console.log(
      `Email de envío enviado para el pedido #${order.orderId}`
    );
  } catch (error) {
    console.error('Error enviando email de pedido enviado:', error);
    throw error;
  }
}