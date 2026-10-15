# ShopSphere — Full Stack E-commerce

🇪🇸 **Español** | [🇬🇧 English](./README.en.md)

ShopSphere es una aplicación de **e-commerce full stack** desarrollada como proyecto práctico para integrar frontend, backend, base de datos, autenticación, gestión de pedidos, panel administrativo e internacionalización.

El proyecto implementa una arquitectura separada entre **Angular + Node.js/Express + PostgreSQL**, con comunicación mediante una API REST protegida con JWT.

---

## 📸 Screenshots

### 🛍️ Catálogo

![Catálogo](docs/screenshots/catalog.png)

### 🛒 Carrito

![Carrito](docs/screenshots/cart.png)

### 📦 Gestión de pedidos

![Pedidos](docs/screenshots/orders.png)

### 🧑‍💼 Panel de administración

![Panel de administración](docs/screenshots/admin-orders.png)

> Las capturas pueden actualizarse a medida que evoluciona el proyecto.

---

## 📑 Contenido

- [Características principales](#-características-principales)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Frontend](#-frontend)
- [Backend](#-backend)
- [Autenticación](#-autenticación)
- [Carrito persistente](#-carrito-persistente)
- [Checkout y pedidos](#-checkout-y-pedidos)
- [Panel de administración](#-panel-de-administración)
- [Gestión de estados de pedidos](#-gestión-de-estados-de-pedidos)
- [Paginación server-side](#-paginación-server-side)
- [Auto-avance de pedidos](#-auto-avance-de-pedidos)
- [Métricas](#-métricas)
- [Internacionalización](#-internacionalización)
- [Interceptors](#-interceptors)
- [Testing](#-testing)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Ejecución](#-ejecución)
- [API](#-api)
- [Decisiones técnicas](#-decisiones-técnicas)
- [Mejoras futuras](#-mejoras-futuras)

---

## ✨ Características principales

### 🛍️ Experiencia de compra

- Catálogo de productos.
- Búsqueda de productos.
- Visualización de precios, stock y categorías.
- Carrito de compras.
- Actualización de cantidades.
- Eliminación de productos.
- Persistencia del carrito en backend.
- Checkout.
- Creación de pedidos.
- Historial de pedidos.
- Consulta del estado de cada pedido.
- Número de seguimiento.
- Secciones informativas de sucursales, envíos, devoluciones, FAQ y términos.

### 🔐 Autenticación y autorización

- Login mediante JWT.
- Persistencia de sesión.
- Interceptor para enviar automáticamente el token.
- Protección de endpoints del backend.
- Roles de usuario y administrador.
- Rutas administrativas protegidas.
- Autorización para consultar pedidos según usuario/rol.

### 🧑‍💼 Administración

El panel administrativo permite:

- Gestionar productos.
- Crear productos.
- Editar productos.
- Eliminar productos.
- Consultar pedidos.
- Cambiar estados de pedidos.
- Seleccionar múltiples pedidos.
- Avanzar pedidos de forma masiva.
- Visualizar pedidos mediante Kanban.
- Visualizar pedidos mediante lista.
- Buscar pedidos.
- Consultar detalles de un pedido.
- Consultar métricas generales.
- Utilizar paginación server-side.

### ⚙️ Backend

- API REST con Express.
- PostgreSQL.
- Consultas SQL.
- Transacciones para creación de pedidos.
- Actualización de stock.
- Persistencia de carrito.
- Manejo centralizado de errores.
- Middleware de autenticación.
- Middleware de autorización.
- Auto-avance automático de pedidos mediante `node-cron`.

---

# 🧰 Stack tecnológico

## Frontend

- Angular 18
- TypeScript
- HTML5
- SCSS
- RxJS
- Angular Router
- Angular Signals
- Angular Localize / i18n
- HttpClient
- Reactive Forms
- Lazy loading

## Backend

- Node.js
- Express
- TypeScript
- JWT
- PostgreSQL
- `pg`
- `node-cron`
- dotenv
- CORS

## Testing

- Angular testing utilities
- Jasmine/Karma
- `HttpTestingController`

## Herramientas

- Git
- GitHub
- VS Code
- npm
- PostgreSQL

---

# 🏗️ Arquitectura

El proyecto está separado en dos aplicaciones principales:

```text
ShopSphere
│
├── Frontend
│   └── Angular
│
└── Backend
    └── Node.js + Express
            │
            ▼
       PostgreSQL
```

La comunicación se realiza mediante una API REST:

```text
Angular
   │
   │ HTTP / JSON
   ▼
Express API
   │
   │ SQL
   ▼
PostgreSQL
```

Esta separación permite mantener desacopladas las responsabilidades del frontend y backend.

---

# 🖥️ Frontend

El frontend está construido con Angular y utiliza una organización basada en funcionalidades.

Entre las principales áreas se encuentran:

```text
src/app/
├── core/
├── features/
├── shared/
└── utils/
```

### Core

Contiene funcionalidades transversales como:

- autenticación
- interceptores
- servicios globales
- manejo de errores
- loading
- notificaciones

### Features

Las funcionalidades principales están organizadas por dominio:

```text
features/
├── auth/
├── cart/
├── checkout/
├── orders/
├── catalog/
└── admin/
```

El panel administrativo contiene además:

```text
admin/
├── dashboard/
├── products/
└── orders/
```

---

# 🔐 Autenticación

La autenticación utiliza **JSON Web Tokens (JWT)**.

Flujo simplificado:

```text
Login
  │
  ▼
POST /api/auth/login
  │
  ▼
Backend valida credenciales
  │
  ▼
JWT
  │
  ▼
Angular almacena sesión
  │
  ▼
Auth Interceptor
  │
  ▼
Authorization: Bearer <token>
```

El interceptor de autenticación agrega automáticamente el token a las solicitudes que requieren autenticación.

Los endpoints administrativos utilizan autorización basada en rol.

---

# 🛒 Carrito persistente

Una de las funcionalidades implementadas fue migrar el carrito desde un estado únicamente local hacia una persistencia real en PostgreSQL.

El carrito está asociado al usuario autenticado.

El backend mantiene los elementos mediante una tabla `cart_items`.

El frontend sincroniza el estado utilizando `CartService` y Angular Signals.

Esto permite que el carrito permanezca disponible aunque el usuario recargue la aplicación.

---

# 💳 Checkout y pedidos

El checkout crea el pedido mediante una transacción de PostgreSQL.

El proceso incluye:

```text
Carrito
   │
   ▼
Checkout
   │
   ▼
Crear pedido
   │
   ├── Crear order
   ├── Crear order_items
   ├── Actualizar stock
   ├── Vaciar carrito
   │
   ▼
COMMIT
```

Si ocurre un error durante la operación, la transacción puede revertirse.

El pedido comienza en estado:

```text
paid
```

y mantiene información como:

- usuario
- productos
- cantidades
- subtotal
- costo de envío
- total
- dirección
- estado
- número de seguimiento
- fecha de creación
- última actualización del estado

---

# 📦 Gestión de estados de pedidos

Los pedidos utilizan el siguiente flujo:

```text
Paid
  ↓
Preparing
  ↓
Shipped
  ↓
Delivered
```

También pueden finalizar en:

```text
Cancelled
```

En el panel administrativo se pueden avanzar pedidos individualmente o en grupo.

La interfaz evita ofrecer el avance cuando el pedido ya se encuentra en un estado final.

Los cambios de estado actualizan también `status_updated_at`, utilizado por el sistema automático de avance.

---

# 📊 Paginación server-side

La administración de pedidos utiliza **paginación del lado del servidor**.

En lugar de descargar todos los pedidos y paginarlos en Angular, el frontend solicita solamente la página necesaria:

```http
GET /api/orders?page=1&limit=10
```

El backend devuelve:

```json
{
  "data": [],
  "meta": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

Esto permite que el frontend trabaje con un conjunto reducido de datos y delegue la paginación a PostgreSQL mediante `LIMIT` y `OFFSET`.

---

# ⏱️ Auto-avance de pedidos

El backend incorpora un proceso automático utilizando **node-cron**.

El job se ejecuta cada minuto:

```text
Cada minuto
    │
    ▼
Revisar pedidos
    │
    ├── paid → processing
    ├── processing → shipped
    └── shipped → delivered
```

Los tiempos utilizados para la simulación son:

| Estado | Tiempo |
|---|---:|
| `paid` → `processing` | 1 minuto |
| `processing` → `shipped` | 2 minutos |
| `shipped` → `delivered` | 3 minutos |

El timestamp `status_updated_at` permite determinar cuánto tiempo lleva el pedido en su estado actual.

Esta funcionalidad permite simular automáticamente el ciclo de fulfillment sin necesidad de cambiar manualmente cada pedido.

---

# 📈 Métricas

El panel administrativo incluye métricas relacionadas con los pedidos.

Entre ellas:

- cantidad total de pedidos
- ingresos totales
- ingresos del mes
- valor promedio del pedido
- distribución por estado

Las métricas se obtienen desde el backend.

---

# 🌍 Internacionalización

ShopSphere está disponible en:

🇪🇸 **Español**

🇬🇧 **English**

La aplicación utiliza **Angular Localize / Angular i18n**.

La build genera las versiones localizadas:

```text
dist/
└── shopsphere-angular/
    └── browser/
        ├── es/
        └── en/
```

También se implementaron rutas localizadas.

### Español

```text
/catalogo
/carrito
/checkout
/pedidos
/sucursales
/devoluciones
/faq
/terminos
/envios
```

### English

```text
/en/catalog
/en/cart
/en/checkout
/en/orders
/en/branches
/en/returns
/en/faq
/en/terms
/en/shipping
```

Además de la navegación, se localizaron elementos de la interfaz como:

- navegación
- carrito
- estados de pedidos
- panel administrativo
- textos de interfaz

---

# 🔄 Interceptors

El frontend utiliza varios interceptores HTTP.

### Auth Interceptor

Agrega el JWT a las solicitudes autenticadas.

### Loading Interceptor

Centraliza el estado de carga de las solicitudes HTTP.

### Error Interceptor

Centraliza el tratamiento de errores HTTP.

### Retry Interceptor

Implementa reintentos para errores transitorios del servidor.

La estrategia actual:

```text
500 / 503
   │
   ├── retry 1 → 1 segundo
   └── retry 2 → 2 segundos
```

No se realizan reintentos para errores como:

```text
400
401
404
```

Tampoco se reintentan solicitudes `POST`.

Esto evita repetir operaciones que podrían generar efectos secundarios.

---

# 🧪 Testing

Se implementaron pruebas para servicios Angular utilizando `HttpTestingController`.

Entre los escenarios cubiertos se encuentran:

- respuestas exitosas
- errores HTTP
- sincronización con backend
- actualización del carrito
- eliminación de productos
- solicitudes HTTP
- manejo de diferentes respuestas

La suite de pruebas del `CartService` cuenta actualmente con **13 tests**.

También se implementaron pruebas específicas para la lógica del retry interceptor, incluyendo:

- requests exitosos
- errores 500
- errores 503
- errores 400
- errores 401
- errores 404
- requests `POST`
- límite de reintentos
- delays progresivos

---

# 📁 Estructura del proyecto

```text
shopsphere-angular/
│
├── backend-ecommerce/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── services/
│   │
│   └── package.json
│
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── features/
│   │   ├── shared/
│   │   └── utils/
│   │
│   ├── locale/
│   │   └── messages.en.xlf
│   │
│   └── environments/
│
├── angular.json
├── package.json
├── package-lock.json
├── db.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

# 🚀 Instalación

## Requisitos

- Node.js 20+
- npm
- PostgreSQL
- Angular CLI 18

Clonar el repositorio:

```bash
git clone https://github.com/florc94/shopsphere-angular.git
cd shopsphere-angular
```

Instalar dependencias del frontend:

```bash
npm install
```

Instalar dependencias del backend:

```bash
cd backend-ecommerce
npm install
```

---

# 🗄️ Configuración de PostgreSQL

Crear una base de datos:

```sql
CREATE DATABASE shopsphere_db;
```

Configurar las variables de entorno del backend:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopsphere_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
```

---

# ▶️ Ejecución

## Backend

Desde:

```text
backend-ecommerce/
```

ejecutar:

```bash
npm run dev
```

El backend estará disponible en:

```text
http://localhost:3000
```

## Frontend

Desde la raíz:

```bash
npm start
```

La aplicación estará disponible en:

```text
http://localhost:4200
```

La versión inglesa se encuentra bajo:

```text
http://localhost:4200/en/
```

---

# 🔑 Usuarios de demostración

Para probar las funcionalidades de la aplicación pueden utilizarse las cuentas configuradas en la base de datos de desarrollo.

### Usuario

```text
Role: user
```

### Administrador

```text
Role: admin
```

> Las credenciales concretas dependen de la configuración local del entorno y no se incluyen como secretos dentro del repositorio.

---

# 🔌 API

Principales endpoints:

## Authentication

```http
POST /api/auth/login
```

## Products

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

## Cart

```http
GET    /api/cart
POST   /api/cart
PATCH  /api/cart/:productId
DELETE /api/cart/:productId
```

## Orders

```http
GET   /api/orders
GET   /api/orders/:id
POST  /api/orders
PATCH /api/orders/:id/status
```

## Metrics

```http
GET /api/orders/metrics
```

Los endpoints administrativos requieren autenticación y autorización mediante JWT.

---

# 🧠 Decisiones técnicas

### PostgreSQL en lugar de almacenamiento únicamente local

Se eligió PostgreSQL para representar una aplicación más cercana a un escenario real y permitir relaciones entre:

```text
users
products
cart_items
orders
order_items
```

### Backend separado del frontend

La separación Angular / Express permite:

- desacoplar responsabilidades
- desarrollar frontend y backend independientemente
- reutilizar la API
- facilitar futuras integraciones

### Paginación en backend

La paginación se realiza mediante SQL en lugar de cargar todos los pedidos en el navegador.

### Signals

Angular Signals se utilizan para manejar estados reactivos como:

- carrito
- autenticación
- pedidos
- loading
- selección de elementos

### Interceptors

Los interceptores centralizan funcionalidades transversales como:

- autenticación
- loading
- errores
- retries

---

# 🔮 Mejoras futuras

Algunas mejoras posibles para futuras versiones:

- Refresh tokens.
- Recuperación de contraseña.
- Integración con una pasarela de pagos real.
- Subida real de imágenes.
- Filtrado y búsqueda server-side.
- Validación más estricta de las transiciones de estados en el backend.
- Dockerización completa del entorno.
- CI/CD.
- Tests end-to-end.
- Mejoras de accesibilidad.
- Optimización de imágenes.
- Deploy en cloud.

---

# 🎯 Qué demuestra este proyecto

ShopSphere fue desarrollado para practicar y demostrar conocimientos en:

- Angular
- TypeScript
- Node.js
- Express
- PostgreSQL
- REST APIs
- JWT
- autenticación y autorización
- SQL
- transacciones
- gestión de estado
- Angular Signals
- RxJS
- interceptores HTTP
- testing
- internacionalización
- paginación server-side
- procesos automáticos con cron
- arquitectura frontend/backend
- Git y GitHub

El objetivo principal fue construir una aplicación que se acercara a un escenario de desarrollo full stack real, incorporando tanto funcionalidades de usuario como herramientas administrativas y procesos de backend.

---

## 📄 Licencia

Proyecto desarrollado con fines educativos y de portfolio.