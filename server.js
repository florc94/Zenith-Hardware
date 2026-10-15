// Mock-API para desarrollo local.
//
// json-server resuelve /products (CRUD genérico: catálogo público +
// admin CRUD) automáticamente. Todo lo que tiene reglas de negocio propias
// —login con rol, checkout, transición de estados de una orden, métricas—
// se maneja acá a mano, ANTES de montar el router genérico, para que estas
// rutas tengan prioridad sobre el CRUD automático de json-server.
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const db = router.db; // instancia de lowdb — mismo archivo db.json
const middlewares = jsonServer.defaults({ noCors: false });

server.use(middlewares);
server.use(jsonServer.bodyParser);

const STATUS_FLOW = ['paid', 'processing', 'shipped', 'delivered'];
const FINAL_STATUSES = ['delivered', 'cancelled'];

function nextStatus(status) {
  const idx = STATUS_FLOW.indexOf(status);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function trackingNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = 'SS-';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ---------------------------------------------------------------
// Auth — cualquier contraseña sirve (es una mock-api), pero el
// EMAIL sí determina el rol: admin@shopsphere.com es admin, el
// resto entra como shopper. Si el email no existe, se crea un
// shopper nuevo al vuelo (mismo comportamiento que antes).
// ---------------------------------------------------------------
server.post('/auth/login', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Email requerido' });
  }

  const normalized = email.toLowerCase().trim();
  let user = db.get('users').find({ email: normalized }).value();

  if (!user) {
    const nextId = (db.get('users').value().reduce((max, u) => Math.max(max, u.id), 0)) + 1;
    user = { id: nextId, name: normalized.split('@')[0], email: normalized, role: 'user' };
    db.get('users').push(user).write();
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: `fake-jwt-${user.id}-${Date.now()}`
  });
});

// ---------------------------------------------------------------
// Checkout — el total y el precio de cada línea se calculan acá,
// a partir del catálogo actual, nunca a partir de lo que mande el
// cliente. También valida y descuenta stock.
// ---------------------------------------------------------------
server.post('/orders', (req, res) => {
  const { userId, customerName, customerEmail, shippingAddress, items } = req.body || {};

  if (!userId || !customerName || !customerEmail || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Faltan datos del pedido' });
  }

  const orderItems = [];
  let total = 0;

  for (const line of items) {
    const product = db.get('products').find({ id: line.productId }).value();
    if (!product) {
      return res.status(400).json({ message: `El producto ${line.productId} no existe` });
    }
    if (product.stock < line.quantity) {
      return res.status(400).json({ message: `Sin stock suficiente de "${product.name}"` });
    }

    const subtotal = Math.round(product.price * line.quantity * 100) / 100;
    total += subtotal;

    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      subtotal
    });

    db.get('products').find({ id: product.id }).assign({ stock: product.stock - line.quantity }).write();
  }

  const now = new Date().toISOString();
  const nextOrderId = (db.get('orders').value().reduce((max, o) => Math.max(max, o.id), 0)) + 1;

  const order = {
    id: nextOrderId,
    userId,
    customerName,
    customerEmail,
    items: orderItems,
    total: Math.round(total * 100) / 100,
    shippingAddress,
    status: 'paid',
    trackingNumber: trackingNumber(),
    statusHistory: [{ status: 'paid', at: now }],
    createdAt: now
  };

  db.get('orders').push(order).write();
  res.status(201).json(order);
});

// ---------------------------------------------------------------
// Métricas — tiene que ir ANTES de /orders/:id, si no Express
// interpreta "metrics" como un :id.
// ---------------------------------------------------------------
server.get('/orders/metrics', (req, res) => {
  const orders = db.get('orders').value();
  const revenueOrders = orders.filter((o) => o.status !== 'cancelled');

  const totalRevenue = round2(revenueOrders.reduce((sum, o) => sum + o.total, 0));

  const now = new Date();
  const thisMonthOrders = revenueOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const thisMonthRevenue = round2(thisMonthOrders.reduce((sum, o) => sum + o.total, 0));

  const avgOrderValue = revenueOrders.length > 0 ? round2(totalRevenue / revenueOrders.length) : 0;

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const deliveryTimesHours = deliveredOrders.map((o) => {
    const paidAt = new Date(o.statusHistory.find((h) => h.status === 'paid')?.at ?? o.createdAt);
    const deliveredAt = new Date(o.statusHistory.find((h) => h.status === 'delivered')?.at ?? o.createdAt);
    return (deliveredAt - paidAt) / (1000 * 60 * 60);
  });
  const avgDeliveryTimeHours = deliveryTimesHours.length > 0
    ? round2(deliveryTimesHours.reduce((a, b) => a + b, 0) / deliveryTimesHours.length)
    : 0;

  const ordersByStatus = { paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

  const salesByProduct = new Map();
  for (const o of revenueOrders) {
    for (const item of o.items) {
      const entry = salesByProduct.get(item.productId) ?? { productId: item.productId, name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.subtotal;
      salesByProduct.set(item.productId, entry);
    }
  }
  const topProducts = [...salesByProduct.values()]
    .map((p) => ({ ...p, revenue: round2(p.revenue) }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    totalRevenue,
    thisMonthRevenue,
    avgOrderValue,
    avgDeliveryTimeHours,
    ordersByStatus,
    topProducts,
    totalOrders: orders.length
  });
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------
// Listado de órdenes — con filtros para shopper (?userId=) y para
// el admin (?search=, ?status=). El admin panel no pagina server-side
// acá para mantener el mock simple: trae todo y filtra/pagina en el
// cliente, que para el volumen de esta demo es más que suficiente.
// ---------------------------------------------------------------
server.get('/orders', (req, res) => {
  let orders = db.get('orders').value();
  const { userId, status, search } = req.query;

  if (userId) {
    orders = orders.filter((o) => String(o.userId) === String(userId));
  }
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    orders = orders.filter((o) =>
      String(o.id).includes(q) ||
      o.trackingNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  }

  orders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

server.get('/orders/:id', (req, res) => {
  const order = db.get('orders').find({ id: Number(req.params.id) }).value();
  if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
  res.json(order);
});

// ---------------------------------------------------------------
// Avanzar/cancelar una orden. Reglas:
// - no se puede tocar una orden en estado final (delivered/cancelled)
// - "cancelled" se puede pedir desde cualquier estado no final
// - para cualquier otro estado, sólo se acepta el siguiente paso exacto
//   del flujo (no se puede saltear pasos ni retroceder)
// ---------------------------------------------------------------
server.patch('/orders/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status: requestedStatus } = req.body || {};
  const order = db.get('orders').find({ id }).value();

  if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

  if (FINAL_STATUSES.includes(order.status)) {
    return res.status(400).json({ message: `La orden ya está en estado final (${order.status}) y no se puede modificar` });
  }

  if (requestedStatus === 'cancelled') {
    // permitido desde cualquier estado no final
  } else {
    const expected = nextStatus(order.status);
    if (requestedStatus !== expected) {
      return res.status(400).json({
        message: expected
          ? `Desde "${order.status}" sólo se puede avanzar a "${expected}" (o cancelar)`
          : `"${order.status}" ya es el último paso del flujo`
      });
    }
  }

  const now = new Date().toISOString();
  const updated = {
    ...order,
    status: requestedStatus,
    statusHistory: [...order.statusHistory, { status: requestedStatus, at: now }]
  };

  db.get('orders').find({ id }).assign(updated).write();
  res.json(updated);
});

// A partir de acá, todo lo demás (empieza por /products) lo resuelve
// json-server: GET/POST/PUT/DELETE genéricos con paginación (_page,
// _limit), orden (_sort, _order) y X-Total-Count en la respuesta.
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Mock API corriendo en http://localhost:${PORT}`);
});
