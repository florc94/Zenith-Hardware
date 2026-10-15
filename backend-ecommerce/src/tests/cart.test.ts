import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../app';

describe('Cart API', () => {

  let token: string;

  async function login() {
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

    return response.body.token;
  }


  // ==========================================
  // OBTENER CARRITO
  // ==========================================

  it('debería rechazar el acceso al carrito sin autenticación', async () => {

    const response = await request(app)
      .get('/api/cart');

    expect(response.status).toBe(401);

  });


  it('debería obtener el carrito de un usuario autenticado', async () => {

    token = await login();

    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

  });


  // ==========================================
  // VALIDACIONES
  // ==========================================

  it('debería rechazar un item sin productId', async () => {

    token = await login();

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        quantity: 1
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty(
      'error',
      'productId y quantity son obligatorios'
    );

  });


  it('debería rechazar un item sin quantity', async () => {

    token = await login();

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: 1
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty(
      'error',
      'productId y quantity son obligatorios'
    );

  });


  // ==========================================
  // PRODUCTO INEXISTENTE
  // ==========================================

  it('debería devolver 404 si el producto no existe', async () => {

    token = await login();

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: 999999,
        quantity: 1
      });

    expect(response.status).toBe(404);

    expect(response.body).toHaveProperty(
      'error',
      'Producto no encontrado'
    );

  });


  // ==========================================
  // STOCK
  // ==========================================

  it('debería rechazar una cantidad superior al stock', async () => {

    token = await login();

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: 1,
        quantity: 999999
      });

    expect(response.status).toBe(400);

    expect(response.body.error)
      .toContain('No hay suficiente stock');

  });


  // ==========================================
  // ELIMINAR ITEM
  // ==========================================

  it('debería poder eliminar un item del carrito', async () => {

    token = await login();

    const response = await request(app)
      .delete('/api/cart/items/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty(
      'success',
      true
    );

  });


  // ==========================================
  // VACIAR CARRITO
  // ==========================================

  it('debería poder vaciar el carrito', async () => {

    token = await login();

    const response = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty(
      'success',
      true
    );

  });

});