import { Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { pool } from '../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { sendVerificationEmail } from '../services/email.service';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const JWT_SECRET: string =
  process.env.JWT_SECRET ?? '';

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está configurado. Definí JWT_SECRET en las variables de entorno.'
  );
}

const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_HOURS = 24;

const FRONTEND_URL = (
  process.env.FRONTEND_URL || 'http://localhost:4200'
).replace(/\/+$/, '');

function hashVerificationToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

// ==========================================
// HELPERS DE PERFIL
// ==========================================

// Convierte una fila de la tabla users en el objeto
// que consume el frontend (sin datos sensibles).
// profileComplete es true solo si están cargados
// DNI, código de área y teléfono (columnas de Mi Cuenta).
function mapUser(u: any) {
  const dni = String(u.dni ?? '').trim();
  const phoneArea = String(u.phone_area ?? '').trim();
  const phone = String(u.phone ?? '').trim();

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    profileComplete: Boolean(dni && phoneArea && phone)
  };
}

function signSession(user: { id: number; role?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role || 'user'
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
}

// ==========================================
// POST /api/auth/login
// ==========================================

export async function login(
  req: Request,
  res: Response
) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      error: 'Credenciales inválidas'
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      `,
      [String(email).trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    let passwordValid = false;

    // Contraseña almacenada con bcrypt.
    if (
      typeof user.password === 'string' &&
      user.password.startsWith('$2')
    ) {
      passwordValid = await bcrypt.compare(
        password,
        user.password
      );
    } else {
      // Migración de contraseñas antiguas.
      passwordValid = password === user.password;

      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(
          password,
          BCRYPT_ROUNDS
        );

        await pool.query(
          `
          UPDATE users
          SET password = $1
          WHERE id = $2
          `,
          [hashedPassword, user.id]
        );
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Las cuentas existentes conservan su acceso.
    // Las nuevas deben verificar su correo.
    if (user.email_verified === false) {
      return res.status(403).json({
        error:
          'Tenés que verificar tu email antes de iniciar sesión.'
      });
    }

    const profile = mapUser(user);

    return res.json({
      ...profile,
      token: signSession(profile),
      emailVerified: true
    });
  } catch (error) {
    console.error('Error en el login:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// ==========================================
// POST /api/auth/register
// ==========================================

export async function register(
  req: Request,
  res: Response
) {
  const { name, email, password } = req.body;

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      error:
        'Nombre, email y contraseña son obligatorios.'
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      error: 'El nombre debe tener al menos 2 caracteres.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error:
        'La contraseña debe tener al menos 6 caracteres.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  let createdUserId: number | null = null;

  try {
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una cuenta con ese email.'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      BCRYPT_ROUNDS
    );

    // El token original solo se envía por correo.
    // En PostgreSQL guardamos su hash.
    const verificationToken = randomBytes(32).toString('hex');
    const tokenHash = hashVerificationToken(
      verificationToken
    );

    const expiresAt = new Date(
      Date.now() +
      VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000
    );

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password,
        role,
        email_verified,
        email_verification_token,
        email_verification_expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        'user',
        FALSE,
        $4,
        $5
      )
      RETURNING
        id,
        name,
        email,
        role
      `,
      [
        normalizedName,
        normalizedEmail,
        hashedPassword,
        tokenHash,
        expiresAt
      ]
    );

    const user = result.rows[0];
    createdUserId = user.id;

    const verificationUrl =
      `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    // Si Resend falla, el registro no se considera completado.
    await sendVerificationEmail(
      user.email,
      user.name,
      verificationUrl
    );

    return res.status(201).json({
      message:
        'Cuenta creada. Revisá tu correo para verificarla.',
      email: user.email
    });
  } catch (error: any) {
    console.error('Error en el registro:', error);

    // Si el email no pudo enviarse, eliminamos únicamente
    // la cuenta nueva y aún no verificada de este intento.
    if (createdUserId !== null) {
      try {
        await pool.query(
          `
          DELETE FROM users
          WHERE id = $1
            AND email_verified = FALSE
          `,
          [createdUserId]
        );
      } catch (cleanupError) {
        console.error(
          'No se pudo limpiar el registro incompleto:',
          cleanupError
        );
      }
    }

    if (error?.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con ese email.'
      });
    }

    return res.status(500).json({
      error:
        'No se pudo completar el registro ni enviar el correo de verificación. Intentá nuevamente.'
    });
  }
}

// ==========================================
// POST /api/auth/verify-email
// ==========================================

export async function verifyEmail(
  req: Request,
  res: Response
) {
  const { token: verificationToken } = req.body;

  if (
    typeof verificationToken !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(verificationToken)
  ) {
    return res.status(400).json({
      error: 'El enlace de verificación no es válido.'
    });
  }

  try {
    const tokenHash = hashVerificationToken(
      verificationToken
    );

    // La actualización es atómica:
    // un token vencido o utilizado no puede reutilizarse.
    const result = await pool.query(
      `
      UPDATE users
      SET
        email_verified = TRUE,
        email_verification_token = NULL,
        email_verification_expires_at = NULL
      WHERE email_verification_token = $1
        AND email_verified = FALSE
        AND email_verification_expires_at > NOW()
      RETURNING
        id,
        name,
        email,
        role,
        dni,
        phone_area,
        phone
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error:
          'El enlace venció, ya fue utilizado o no es válido. Si necesitás ayuda, solicitá un nuevo enlace de verificación.'
      });
    }

    const profile = mapUser(result.rows[0]);

    return res.json({
      ...profile,
      token: signSession(profile),
      emailVerified: true,
      message: 'Tu cuenta ha sido validada correctamente.'
    });
  } catch (error) {
    console.error(
      'Error verificando el email:',
      error
    );

    return res.status(500).json({
      error:
        'No se pudo verificar el correo. Intentá nuevamente.'
    });
  }
}