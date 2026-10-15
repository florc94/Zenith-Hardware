
import { Request, Response } from 'express';
import { pool } from '../config/db';

// =====================================================
// MI CUENTA
// =====================================================

const PROFILE_SELECT = `
  id,
  email,
  name,
  COALESCE(dni, '') AS dni,
  COALESCE(phone_area, '') AS "phoneArea",
  COALESCE(phone, '') AS phone,
  COALESCE(street, '') AS street,
  COALESCE(floor_apt, '') AS "floorApt",
  COALESCE(postal_code, '') AS "postalCode",
  COALESCE(city, '') AS city,
  COALESCE(province, '') AS province,
  tax_condition AS "taxCondition",
  COALESCE(tax_id, '') AS "taxId",
  COALESCE(tax_name, '') AS "taxName"
`;

const TAX_CONDITIONS = [
  'final_consumer',
  'registered',
  'unregistered',
  'monotributo',
  'exempt'
] as const;

type TaxCondition = typeof TAX_CONDITIONS[number];

interface ProfileInput {
  name: string;
  dni: string;
  phoneArea: string;
  phone: string;
  street: string;
  floorApt: string;
  postalCode: string;
  city: string;
  province: string;
  taxCondition: TaxCondition;
  taxId: string;
  taxName: string;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getAuthenticatedUserId(req: Request): number | null {
  const rawUserId = (req as any).user?.id;

  if (
    rawUserId === undefined ||
    rawUserId === null ||
    rawUserId === ''
  ) {
    return null;
  }

  const userId = Number(rawUserId);

  return Number.isInteger(userId) && userId > 0
    ? userId
    : null;
}

function parseProfile(
  body: any
): { data?: ProfileInput; error?: string } {
  const taxCondition = text(body?.taxCondition);

  if (!TAX_CONDITIONS.includes(taxCondition as TaxCondition)) {
    return { error: 'La condición fiscal no es válida.' };
  }

  const data: ProfileInput = {
    name: text(body?.name),
    dni: text(body?.dni),
    phoneArea: text(body?.phoneArea),
    phone: text(body?.phone),
    street: text(body?.street),
    floorApt: text(body?.floorApt),
    postalCode: text(body?.postalCode),
    city: text(body?.city),
    province: text(body?.province),
    taxCondition: taxCondition as TaxCondition,
    taxId: text(body?.taxId),
    taxName: text(body?.taxName)
  };

  if (!data.name || data.name.length > 120) {
    return { error: 'Ingresá tu nombre y apellido.' };
  }

  if (!/^\d{7,8}$/.test(data.dni)) {
    return { error: 'El DNI personal debe tener entre 7 y 8 números.' };
  }

  if (!/^\d{2,5}$/.test(data.phoneArea)) {
    return { error: 'El código de área no es válido.' };
  }

  if (!/^\d{5,10}$/.test(data.phone)) {
    return { error: 'El teléfono no es válido.' };
  }

  if (!data.street || data.street.length > 160) {
    return { error: 'Ingresá tu dirección.' };
  }

  if (data.floorApt.length > 40) {
    return { error: 'Piso / departamento demasiado largo.' };
  }

  if (!/^[A-Za-z0-9]{4,8}$/.test(data.postalCode)) {
    return { error: 'El código postal no es válido.' };
  }

  if (!data.city || data.city.length > 100) {
    return { error: 'Ingresá tu localidad.' };
  }

  if (!data.province || data.province.length > 100) {
    return { error: 'Ingresá tu provincia.' };
  }

  const isDni = /^\d{7,8}$/.test(data.taxId);
  const isCuitCuil = /^\d{11}$/.test(data.taxId);

  if (data.taxCondition === 'final_consumer') {
    if (!isDni && !isCuitCuil) {
      return {
        error:
          'Para consumidor final, ingresá un DNI de 7 u 8 dígitos o un CUIT/CUIL de 11 dígitos.'
      };
    }
  } else if (!isCuitCuil) {
    return {
      error:
        'Para esta condición fiscal, ingresá un CUIT de 11 dígitos.'
    };
  }

  if (!data.taxName || data.taxName.length > 120) {
    return { error: 'Ingresá el nombre o razón social para la factura.' };
  }

  return { data };
}

// =====================================================
// GET /api/users/me
// =====================================================

export async function getMyProfile(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  if (userId === null) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT ${PROFILE_SELECT}
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// =====================================================
// PUT /api/users/me
// =====================================================

export async function updateMyProfile(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  if (userId === null) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const { data, error } = parseProfile(req.body);

  if (!data) {
    res.status(400).json({ error });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        dni = $2,
        phone_area = $3,
        phone = $4,
        street = $5,
        floor_apt = $6,
        postal_code = $7,
        city = $8,
        province = $9,
        tax_condition = $10,
        tax_id = $11,
        tax_name = $12
      WHERE id = $13
      RETURNING ${PROFILE_SELECT}
      `,
      [
        data.name,
        data.dni,
        data.phoneArea,
        data.phone,
        data.street,
        data.floorApt,
        data.postalCode,
        data.city,
        data.province,
        data.taxCondition,
        data.taxId,
        data.taxName,
        userId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// =====================================================
// ADMIN: GET /api/users
// =====================================================

export async function getUsers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at AS "createdAt",
        COUNT(DISTINCT o.id)::INTEGER AS "orderCount"
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// =====================================================
// ADMIN: GET /api/users/:id
// =====================================================

export async function getUserById(
  req: Request,
  res: Response
): Promise<void> {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'ID de usuario inválido.' });
    return;
  }

  try {
    const userResult = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at AS "createdAt",
        COUNT(DISTINCT o.id)::INTEGER AS "orderCount",
        COALESCE(
          SUM(
            CASE
              WHEN o.status NOT IN ('cancelled', 'cancelado')
              THEN o.total
              ELSE 0
            END
          ),
          0
        ) AS "totalSpent"
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const ordersResult = await pool.query(
      `
      SELECT
        o.id,
        o.status,
        o.subtotal,
        o.shipping_cost AS "shippingCost",
        o.total,
        o.shipping_address AS "shippingAddress",
        o.created_at AS "createdAt",
        o.status_updated_at AS "statusUpdatedAt"
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    const orders = ordersResult.rows;

    res.json({
      ...userResult.rows[0],
      totalSpent: Number(userResult.rows[0].totalSpent || 0),
      lastOrder: orders[0] ?? null,
      orders
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// =====================================================
// ADMIN: PATCH /api/users/:id/role
// =====================================================

export async function updateUserRole(
  req: Request,
  res: Response
): Promise<void> {
  const userId = Number(req.params.id);
  const { role } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'ID de usuario inválido.' });
    return;
  }

  if (role !== 'user' && role !== 'admin') {
    res.status(400).json({ error: 'El rol debe ser "user" o "admin".' });
    return;
  }

  const currentUserId = getAuthenticatedUserId(req);

  if (currentUserId === null) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  if (currentUserId === userId) {
    res.status(403).json({
      error: 'No podés modificar tu propio rol.'
    });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, name, email, role, created_at AS "createdAt"
      `,
      [role, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      message: 'Rol actualizado correctamente.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// =====================================================
// ADMIN: DELETE /api/users/:id
// =====================================================

export async function deleteUser(
  req: Request,
  res: Response
): Promise<void> {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'ID de usuario inválido.' });
    return;
  }

  const currentUserId = getAuthenticatedUserId(req);

  if (currentUserId === null) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  if (currentUserId === userId) {
    res.status(403).json({
      error: 'No podés eliminar tu propia cuenta.'
    });
    return;
  }

  try {
    const userResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    if (userResult.rows[0].role === 'admin') {
      res.status(403).json({
        error: 'No se pueden eliminar cuentas de administrador.'
      });
      return;
    }

    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);

    res.json({
      message: 'Usuario eliminado correctamente.',
      userId
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


// =====================================================
// PATCH /api/users/me/contact
//
// Guarda solo código de área, teléfono y DNI/CUIL.
// Se usa en la ventana que aparece al verificar la cuenta,
// donde todavía no existen domicilio ni datos fiscales.
// =====================================================

export async function updateMyContact(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  if (userId === null) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const phoneArea = text(req.body?.phoneArea).replace(/\D/g, '');
  const phone = text(req.body?.phone).replace(/\D/g, '');
  const document = text(req.body?.document).replace(/\D/g, '');

  if (!/^\d{2,5}$/.test(phoneArea)) {
    res.status(400).json({ error: 'El código de área no es válido.' });
    return;
  }

  if (!/^\d{5,10}$/.test(phone)) {
    res.status(400).json({ error: 'El teléfono no es válido.' });
    return;
  }

  // El DNI se guarda en la columna "dni" (7-8 dígitos).
  // Si la persona ingresa un CUIL (11 dígitos), el DNI son los
  // 8 dígitos del medio (se quitan los ceros a la izquierda).
  let dni = document;

  if (/^\d{11}$/.test(document)) {
    const prefix = document.slice(0, 2);

    // 20, 23, 24 y 27 son CUIL de personas.
    if (!['20', '23', '24', '27'].includes(prefix)) {
      res.status(400).json({
        error: 'Ingresá un DNI o un CUIL personal válido.'
      });
      return;
    }

    dni = document.slice(2, 10).replace(/^0+/, '');
  }

  if (!/^\d{7,8}$/.test(dni)) {
    res.status(400).json({
      error: 'Ingresá un DNI de 7 u 8 números o un CUIL de 11.'
    });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET
        dni = $1,
        phone_area = $2,
        phone = $3,
        -- Precarga la identificación de facturación solo si
        -- todavía no tenía una, para no pisar datos existentes.
        tax_id = COALESCE(NULLIF(tax_id, ''), $4),
        tax_condition = COALESCE(tax_condition, 'final_consumer')
      WHERE id = $5
      RETURNING ${PROFILE_SELECT}
      `,
      [dni, phoneArea, phone, document, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al guardar los datos de contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}