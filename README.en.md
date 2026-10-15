# ShopSphere — Full Stack E-commerce

[🇪🇸 Español](./README.md) | 🇬🇧 **English**

ShopSphere is a **full stack e-commerce application** developed as a practical project to integrate frontend, backend, database, authentication, order management, administration and internationalization.

The project uses a separated architecture based on **Angular + Node.js/Express + PostgreSQL**, communicating through a JWT-protected REST API.

---

## 📸 Screenshots

### 🛍️ Product Catalog

![Product Catalog](docs/screenshots/catalog.png)

### 🛒 Shopping Cart

![Shopping Cart](docs/screenshots/cart.png)

### 📦 Order Management

![Orders](docs/screenshots/orders.png)

### 🧑‍💼 Admin Panel

![Admin Panel](docs/screenshots/admin-orders.png)

> Screenshots can be updated as the project evolves.

---

## 📑 Contents

- [Main Features](#-main-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Frontend](#-frontend)
- [Backend](#-backend)
- [Authentication](#-authentication)
- [Persistent Cart](#-persistent-cart)
- [Checkout and Orders](#-checkout-and-orders)
- [Admin Panel](#-admin-panel)
- [Order Status Management](#-order-status-management)
- [Server-side Pagination](#-server-side-pagination)
- [Automatic Order Progression](#-automatic-order-progression)
- [Metrics](#-metrics)
- [Internationalization](#-internationalization)
- [HTTP Interceptors](#-http-interceptors)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [API](#-api)
- [Technical Decisions](#-technical-decisions)
- [Future Improvements](#-future-improvements)

---

# ✨ Main Features

### 🛍️ Shopping Experience

- Product catalog.
- Product search.
- Price, stock and category information.
- Shopping cart.
- Quantity updates.
- Product removal.
- Persistent cart storage in the backend.
- Checkout.
- Order creation.
- Order history.
- Order status tracking.
- Tracking number.
- Informational sections for branches, shipping, returns, FAQ and terms.

### 🔐 Authentication and Authorization

- JWT-based login.
- Session persistence.
- Authentication interceptor.
- Protected backend endpoints.
- User and administrator roles.
- Protected administrative routes.
- Order access authorization based on user/role.

### 🧑‍💼 Administration

The administration panel provides:

- Product management.
- Product creation.
- Product editing.
- Product deletion.
- Order management.
- Order status updates.
- Multiple order selection.
- Bulk order progression.
- Kanban order view.
- List order view.
- Order search.
- Order details.
- Order metrics.
- Server-side pagination.

### ⚙️ Backend

- REST API built with Express.
- PostgreSQL database.
- SQL queries.
- PostgreSQL transactions for order creation.
- Stock updates.
- Persistent shopping cart.
- Centralized error handling.
- Authentication middleware.
- Authorization middleware.
- Automatic order progression using `node-cron`.

---

# 🧰 Tech Stack

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

## Tools

- Git
- GitHub
- VS Code
- npm
- PostgreSQL

---

# 🏗️ Architecture

The project is divided into two main applications:

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

Communication takes place through a REST API:

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

This separation keeps frontend and backend responsibilities decoupled.

---

# 🖥️ Frontend

The frontend is built with Angular and organized around application features.

Main areas include:

```text
src/app/
├── core/
├── features/
├── shared/
└── utils/
```

### Core

Contains cross-cutting functionality such as:

- authentication
- HTTP interceptors
- global services
- error handling
- loading state
- notifications

### Features

Main application domains are organized as:

```text
features/
├── auth/
├── cart/
├── checkout/
├── orders/
├── catalog/
└── admin/
```

The administration area contains:

```text
admin/
├── dashboard/
├── products/
└── orders/
```

---

# 🔐 Authentication

Authentication is implemented using **JSON Web Tokens (JWT)**.

Simplified flow:

```text
Login
  │
  ▼
POST /api/auth/login
  │
  ▼
Backend validates credentials
  │
  ▼
JWT
  │
  ▼
Angular stores session
  │
  ▼
Auth Interceptor
  │
  ▼
Authorization: Bearer <token>
```

The authentication interceptor automatically adds the token to authenticated requests.

Administrative endpoints also use role-based authorization.

---

# 🛒 Persistent Cart

The shopping cart was migrated from a purely local state to real persistence in PostgreSQL.

The cart is associated with the authenticated user.

The backend stores cart items using a `cart_items` table.

The frontend synchronizes cart state through `CartService` and Angular Signals.

This allows the cart to remain available after refreshing the application.

---

# 💳 Checkout and Orders

Checkout creates an order using a PostgreSQL transaction.

The process includes:

```text
Cart
  │
  ▼
Checkout
  │
  ▼
Create Order
  │
  ├── Create order
  ├── Create order_items
  ├── Update stock
  ├── Clear cart
  │
  ▼
COMMIT
```

If an error occurs during the operation, the transaction can be rolled back.

New orders start with:

```text
paid
```

Orders contain information such as:

- user
- products
- quantities
- subtotal
- shipping cost
- total
- shipping address
- status
- tracking number
- creation date
- status update timestamp

---

# 📦 Order Status Management

Orders use the following progression:

```text
Paid
  ↓
Preparing
  ↓
Shipped
  ↓
Delivered
```

They can also end in:

```text
Cancelled
```

The administration panel allows orders to be progressed individually or in bulk.

The UI does not offer a progression action when an order is already in a final state.

Status changes also update `status_updated_at`, which is used by the automatic order progression system.

---

# 📊 Server-side Pagination

The admin order management uses **server-side pagination**.

Instead of downloading all orders and paginating them in Angular, the frontend requests only the required page:

```http
GET /api/orders?page=1&limit=10
```

The backend returns:

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

Pagination is therefore handled by the backend and PostgreSQL using `LIMIT` and `OFFSET`.

This keeps the amount of data transferred to the browser under control.

---

# ⏱️ Automatic Order Progression

The backend includes an automated process using **node-cron**.

The job runs every minute:

```text
Every minute
    │
    ▼
Check orders
    │
    ├── paid → processing
    ├── processing → shipped
    └── shipped → delivered
```

The current simulation delays are:

| Status | Delay |
|---|---:|
| `paid` → `processing` | 1 minute |
| `processing` → `shipped` | 2 minutes |
| `shipped` → `delivered` | 3 minutes |

The `status_updated_at` timestamp is used to determine how long an order has remained in its current state.

This provides an automated fulfillment simulation without manually changing every order.

---

# 📈 Metrics

The administration dashboard includes order-related metrics such as:

- total number of orders
- total revenue
- current-month revenue
- average order value
- orders grouped by status

The metrics are calculated and provided by the backend.

---

# 🌍 Internationalization

ShopSphere is available in:

🇪🇸 **Spanish**

🇬🇧 **English**

The application uses **Angular Localize / Angular i18n**.

The localized build generates:

```text
dist/
└── shopsphere-angular/
    └── browser/
        ├── es/
        └── en/
```

Localized routes are also supported.

### Spanish

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

The localization covers interface elements including:

- navigation
- shopping cart
- order statuses
- administration panel
- interface text

---

# 🔄 HTTP Interceptors

The frontend uses several HTTP interceptors.

### Auth Interceptor

Automatically adds the JWT to authenticated requests.

### Loading Interceptor

Centralizes HTTP loading state.

### Error Interceptor

Provides centralized HTTP error handling.

### Retry Interceptor

Retries transient server errors.

Current strategy:

```text
500 / 503
   │
   ├── retry 1 → 1 second
   └── retry 2 → 2 seconds
```

Errors such as:

```text
400
401
404
```

are not retried.

`POST` requests are also excluded from automatic retries to avoid accidentally repeating operations with side effects.

---

# 🧪 Testing

Angular services are tested using `HttpTestingController`.

Test scenarios include:

- successful responses
- HTTP errors
- backend synchronization
- cart updates
- product removal
- HTTP requests
- different response scenarios

The `CartService` test suite currently contains **13 tests**.

Dedicated retry interceptor tests cover:

- successful requests
- HTTP 500
- HTTP 503
- HTTP 400
- HTTP 401
- HTTP 404
- `POST` requests
- retry limits
- progressive retry delays

---

# 📁 Project Structure

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

# 🚀 Installation

## Requirements

- Node.js 20+
- npm
- PostgreSQL
- Angular CLI 18

Clone the repository:

```bash
git clone https://github.com/florc94/shopsphere-angular.git
cd shopsphere-angular
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend-ecommerce
npm install
```

---

# 🗄️ PostgreSQL Configuration

Create the database:

```sql
CREATE DATABASE shopsphere_db;
```

Configure the backend environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopsphere_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
```

---

# ▶️ Running the Project

## Backend

From:

```text
backend-ecommerce/
```

run:

```bash
npm run dev
```

The backend will be available at:

```text
http://localhost:3000
```

## Frontend

From the project root:

```bash
npm start
```

The application will be available at:

```text
http://localhost:4200
```

The English version is available under:

```text
http://localhost:4200/en/
```

---

# 🔑 Demo Users

The application can be tested using the accounts configured in the development database.

### User

```text
Role: user
```

### Administrator

```text
Role: admin
```

> Exact credentials depend on the local development environment and are not stored as secrets in the repository.

---

# 🔌 API

Main endpoints:

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

Administrative endpoints require authentication and JWT-based authorization.

---

# 🧠 Technical Decisions

### PostgreSQL instead of local-only storage

PostgreSQL was chosen to model a more realistic application and establish relationships between:

```text
users
products
cart_items
orders
order_items
```

### Separate frontend and backend

The Angular / Express separation allows:

- decoupled responsibilities
- independent frontend and backend development
- API reuse
- future integrations

### Server-side pagination

Pagination is handled through SQL instead of loading every order into the browser.

### Angular Signals

Signals are used for reactive state such as:

- shopping cart
- authentication
- orders
- loading
- item selection

### HTTP Interceptors

Interceptors centralize cross-cutting concerns such as:

- authentication
- loading state
- error handling
- retries

---

# 🔮 Future Improvements

Potential improvements for future versions include:

- Refresh tokens.
- Password recovery.
- Real payment gateway integration.
- Real image upload.
- Server-side filtering and search.
- Stricter backend validation of order status transitions.
- Complete Dockerization.
- CI/CD.
- End-to-end testing.
- Accessibility improvements.
- Image optimization.
- Cloud deployment.

---

# 🎯 What This Project Demonstrates

ShopSphere was developed to demonstrate practical knowledge of:

- Angular
- TypeScript
- Node.js
- Express
- PostgreSQL
- REST APIs
- JWT
- authentication and authorization
- SQL
- database transactions
- state management
- Angular Signals
- RxJS
- HTTP interceptors
- testing
- internationalization
- server-side pagination
- scheduled backend processes
- frontend/backend architecture
- Git and GitHub

The main goal was to build an application closer to a real-world full stack scenario, combining customer-facing functionality with administrative tools and backend processes.

---

## 📄 License

This project was developed for educational and portfolio purposes.