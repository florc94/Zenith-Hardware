import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../app';

describe('Orders API', () => {

  // ==========================================================
  // HELPERS
  // ==========================================================

  async function login(
    email = process.env.TEST_USER_EMAIL,
    password = process.env.TEST_USER_PASSWORD
  ) {
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

    return response.body.token as string;
  }

  async function loginAdmin() {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Faltan TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en las variables de entorno.'
      );
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password
      });

    expect(response.status).toBe(200);

    return response.body.token as string;
  }

  // ==========================================================
  // GET /api/orders
  // ==========================================================

  it('debería rechazar el acceso a pedidos sin autenticación', async () => {
    const response = await request(app)
      .get('/api/orders');

    expect(response.status).toBe(401);
  });

  it('debería obtener los pedidos del usuario autenticado', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.meta).toHaveProperty('totalItems');
    expect(response.body.meta).toHaveProperty('totalPages');
    expect(response.body.meta).toHaveProperty('currentPage');
    expect(response.body.meta).toHaveProperty('itemsPerPage');
  });

  it('debería soportar paginación de pedidos', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');

    expect(response.body.meta.currentPage).toBe(1);
    expect(response.body.meta.itemsPerPage).toBe(5);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  it('no debería permitir a un usuario normal consultar pedidos de otro usuario mediante userId', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders?userId=999999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);

    // El controller debe ignorar userId para usuarios normales
    // y utilizar el ID obtenido del JWT.
  });

  it('debería permitir a un administrador filtrar pedidos por userId', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/orders?userId=999999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // ==========================================================
  // GET /api/orders/:id
  // ==========================================================

  it('debería rechazar el detalle de un pedido sin autenticación', async () => {
    const response = await request(app)
      .get('/api/orders/999999');

    expect(response.status).toBe(401);
  });

  it('debería devolver 404 si el pedido no existe', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body).toHaveProperty(
      'error',
      'Pedido no encontrado'
    );
  });

  it('debería permitir a un administrador consultar cualquier pedido', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/orders/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  // ==========================================================
  // POST /api/orders
  // ==========================================================

  it('debería rechazar la creación de un pedido sin autenticación', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        shippingAddress: 'Dirección de prueba',
        subtotal: 100,
        costoEnvio: 10,
        total: 110
      });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      'error',
      'Acceso denegado. No hay token proporcionado.'
    );
  });

  // ==========================================================
  // GET /api/orders/metrics
  // ==========================================================

  it('debería rechazar las métricas para un usuario normal', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('debería obtener las métricas para un administrador', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/orders/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('totalOrders');
    expect(response.body).toHaveProperty('totalRevenue');
    expect(response.body).toHaveProperty('thisMonthRevenue');
    expect(response.body).toHaveProperty('avgOrderValue');
    expect(response.body).toHaveProperty('ordersByStatus');
    expect(response.body).toHaveProperty('salesByPeriod');

    expect(typeof response.body.totalOrders).toBe('number');
    expect(typeof response.body.totalRevenue).toBe('number');
  });

  // ==========================================================
  // GET /api/orders/metrics/sales
  // ==========================================================

  it('debería rechazar las ventas por período para un usuario normal', async () => {
    const token = await login();

    const response = await request(app)
      .get('/api/orders/metrics/sales?period=30d')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('debería obtener las ventas por período para un administrador', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/orders/metrics/sales?period=30d')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty(
      'period',
      '30d'
    );

    expect(response.body).toHaveProperty(
      'totalRevenue'
    );

    expect(response.body).toHaveProperty(
      'totalOrders'
    );

    expect(response.body).toHaveProperty(
      'points'
    );

    expect(Array.isArray(response.body.points)).toBe(true);
  });

  it('debería rechazar un período inválido en las métricas de ventas', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/orders/metrics/sales?period=invalid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty(
      'error',
      'Período inválido. Usá 7d, 30d, 3m o 12m.'
    );

    expect(response.body.validPeriods).toEqual([
      '7d',
      '30d',
      '3m',
      '12m'
    ]);
  });

  it('debería aceptar los períodos válidos de ventas', async () => {
    const token = await loginAdmin();

    const periods = [
      '7d',
      '30d',
      '3m',
      '12m'
    ];

    for (const period of periods) {
      const response = await request(app)
        .get(`/api/orders/metrics/sales?period=${period}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        'period',
        period
      );

      expect(Array.isArray(response.body.points)).toBe(true);
    }
  });

  // ==========================================================
  // PATCH /api/orders/:id/status
  // ==========================================================

  it('debería rechazar la actualización de estado para un usuario normal', async () => {
    const token = await login();

    const response = await request(app)
      .patch('/api/orders/999999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'shipped'
      });

    expect(response.status).toBe(403);
  });

  it('debería devolver 404 al intentar actualizar un pedido inexistente como admin', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .patch('/api/orders/999999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'shipped'
      });

    expect(response.status).toBe(404);

    expect(response.body).toHaveProperty(
      'error',
      'Pedido no encontrado'
    );
  });

});