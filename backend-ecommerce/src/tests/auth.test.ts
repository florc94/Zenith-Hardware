import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../app';

describe('POST /api/auth/login', () => {

  it('debería rechazar credenciales incorrectas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'usuario-inexistente@test.com',
        password: 'password-incorrecta'
      });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      'error',
      'Credenciales inválidas'
    );
  });

  it('debería iniciar sesión con credenciales válidas y devolver un JWT', async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Faltan TEST_USER_EMAIL y TEST_USER_PASSWORD en las variables de entorno.'
      );
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('email', email);
    expect(response.body).toHaveProperty('role');
    expect(response.body).toHaveProperty('token');

    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });

});

it('debería rechazar el registro si faltan campos obligatorios', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: '',
      email: '',
      password: ''
    });

  expect(response.status).toBe(400);

  expect(response.body).toHaveProperty(
    'error',
    'Nombre, email y contraseña son obligatorios.'
  );
});

it('debería rechazar una contraseña menor a 6 caracteres', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usuario Test',
      email: 'nuevo-test@example.com',
      password: '12345'
    });

  expect(response.status).toBe(400);

  expect(response.body).toHaveProperty(
    'error',
    'La contraseña debe tener al menos 6 caracteres.'
  );
});

it('debería rechazar un email que ya existe', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usuario Existente',
      email: 'shopper@shopsphere.com',
      password: '123456'
    });

  expect(response.status).toBe(409);

  expect(response.body).toHaveProperty(
    'error',
    'Ya existe una cuenta con ese email.'
  );
});