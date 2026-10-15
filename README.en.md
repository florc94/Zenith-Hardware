# Zenith Hardware — Full Stack E-commerce

🇬🇧 English | [🇪🇸 Español](./README.md)

Zenith Hardware is a **full-stack e-commerce application** built with Angular, Node.js, Express, and PostgreSQL. The project combines a shopping experience, user authentication, order management, and an administrative dashboard in a frontend/backend architecture connected through a REST API.

The goal is to apply software development best practices, modular architecture, data persistence, security, error handling, and internationalization in an application inspired by a real-world e-commerce platform.

## ✨ Key Features

### 🛍️ Shopping Experience

- Product catalog organized by categories.
- Product search and browsing.
- Product pricing and availability display.
- Product detail pages.
- Shopping cart with quantity management.
- Persistent cart for authenticated users.
- Product comparison.
- Favorites list.
- Checkout process.
- Order creation and history.
- Order details and tracking.
- Informational sections for shipping, returns, store locations, FAQs, and terms.
- Responsive interface for different screen sizes.

### 🔐 Authentication and Authorization

- User registration and login.
- JSON Web Token (JWT)-based authentication.
- HTTP interceptor for attaching authentication tokens.
- Route protection based on authentication status.
- User and administrator roles.
- Authentication and authorization middleware on the backend.
- Access restrictions based on user permissions.

### 🧑‍💼 Admin Dashboard

- Product creation, editing, and deletion.
- Order overview and management.
- Kanban and list views for orders.
- Order search and detail views.
- Individual and bulk order status updates.
- Server-side pagination.
- Dashboard with order metrics.
- User management and user details.

### ⚙️ Backend Features

- REST API built with Express and TypeScript.
- PostgreSQL data persistence.
- SQL queries using the `pg` client.
- Centralized error handling.
- Authentication and authorization middleware.
- Cart, favorites, and order management.
- Stock updates during order creation.
- Database transactions for related order operations.
- Notification and email services.
- Automated order status progression.

## 🧰 Technology Stack

### Frontend

- Angular 18
- TypeScript
- HTML5 and SCSS
- RxJS
- Angular Router
- Angular Signals
- Angular Localize / i18n
- HttpClient
- Reactive Forms
- Lazy loading

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- `pg`
- JSON Web Tokens (JWT)
- `dotenv`
- CORS
- `node-cron` for scheduled tasks, if enabled in the current configuration

### Testing

- Vitest for backend testing.
- Backend unit tests for the modules currently covered by the test suite.
- Angular component and service tests.
- HTTP interceptor and error-handling tests.

### Tools and Deployment

- Git and GitHub
- npm
- Docker
- Docker Compose
- Nginx
- PostgreSQL

## 🏗️ Architecture

The project is organized as a single repository containing two main applications:

```text
zenith-hardware/
├── src/                    # Angular frontend
├── backend-ecommerce/      # Express backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── tests/
├── scripts/                # Auxiliary scripts
├── angular.json
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── README.md
└── README.en.md
```

The frontend and backend communicate over HTTP using JSON.

```text
┌─────────────────────────┐
│    Angular Frontend     │
│  Components / Services  │
└────────────┬────────────┘
             │ HTTP / JSON
             ▼
┌─────────────────────────┐
│    Express REST API     │
│ Controllers / Services  │
└────────────┬────────────┘
             │ SQL
             ▼
┌─────────────────────────┐
│       PostgreSQL        │
└─────────────────────────┘
```

This separation keeps client-side responsibilities, business logic, and data persistence decoupled.

## 🖥️ Frontend

The frontend follows a modular architecture organized around application features.

```text
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── features/
│   ├── account/
│   ├── admin/
│   ├── auth/
│   ├── cart/
│   ├── catalog/
│   ├── checkout/
│   ├── favorites/
│   ├── home/
│   ├── orders/
│   └── reviews/
├── shared/
│   ├── components/
│   └── pipes/
└── utils/
```

### Core

Contains functionality shared across different areas of the application:

- Authentication services.
- Route guards.
- HTTP interceptors.
- Global loading state.
- Notifications.
- Shared data models and utilities.

### Features

Each feature groups related components, services, and models, making the application easier to maintain and extend.

### Responsive Design

The interface uses Angular, HTML, and SCSS to organize components and adapt the experience to desktop and mobile devices.

## 🔐 Authentication

The authentication flow uses JWT.

```text
User
   │
   ▼
POST /api/auth/login
   │
   ▼
Credential validation
   │
   ▼
JWT issuance
   │
   ▼
Authenticated frontend
   │
   ▼
Auth Interceptor
   │
   ▼
Authorization: Bearer <token>
```

The frontend uses an interceptor to attach the token when required. On the backend, middleware verifies authentication and the permissions needed to access protected resources.

**Security note:** authorization must be enforced on the backend, regardless of any protected Angular routes.

## 🛒 Shopping Cart

The shopping cart allows users to add products, update quantities, and remove items.

For authenticated users, the backend manages cart persistence in PostgreSQL through the relevant cart endpoints and services.

The frontend uses `CartService` and reactive state to keep the interface up to date.

## ❤️ Favorites and Product Comparison

The application includes features for saving favorite products and comparing product specifications.

These tools enhance the shopping experience and help users evaluate products before making a decision.

## 💳 Checkout and Order Management

The checkout process connects the shopping cart to order creation.

The general workflow is:

```text
Shopping Cart
   │
   ▼
Checkout
   │
   ▼
Operation validation
   │
   ▼
Order creation
   ├── Order record
   ├── Order items
   ├── Stock update
   └── Cart update
   │
   ▼
Transaction commit
```

Operations performed within a PostgreSQL transaction can be rolled back if an error occurs before the changes are committed.

Orders store information related to the user, products, quantities, amounts, status, and available tracking details.

The checkout in this project is a practice implementation; it does not imply that a real payment gateway is integrated.

## 📦 Order Statuses

The order workflow covers the main stages of order processing:

```text
Paid
  │
  ▼
Processing
  │
  ▼
Shipped
  │
  ▼
Delivered
```

Orders may also transition to a final cancellation status when applicable.

The admin dashboard allows authorized users to view orders and update their statuses. Available actions depend on the current status and the application's business rules.

## ⏱️ Order Automation

The backend includes a service for automating order progression through scheduled tasks.

Its purpose is to simulate order fulfillment stages and reduce the need to update each order manually during testing.

The exact intervals, statuses, and conditions depend on the service configuration. In a production environment, these transitions should follow explicit business rules and account for concurrent backend instances.

## 📊 Admin Dashboard

The dashboard brings together metrics related to store activity.

The metrics covered include:

- Total number of orders.
- Recorded revenue.
- Monthly revenue.
- Average order value.
- Order distribution by status.

Data is retrieved through backend services and displayed in the administrative interface.

## 📄 Server-Side Pagination

The application uses backend pagination to avoid downloading every record when only one page is needed.

Example request:

```http
GET /api/orders?page=1&limit=10
```

The backend can use SQL `LIMIT` and `OFFSET` to retrieve the requested records and return the pagination metadata consumed by the frontend.

This approach is useful as the volume of orders grows.

## 🌍 Internationalization

Zenith Hardware supports two languages:

- 🇪🇸 Spanish
- 🇬🇧 English

The application uses Angular Localize and XLIFF translation files.

Main localized routes include:

| Spanish | English |
|---|---|
| `/catalogo` | `/en/catalog` |
| `/carrito` | `/en/cart` |
| `/checkout` | `/en/checkout` |
| `/pedidos` | `/en/orders` |
| `/sucursales` | `/en/branches` |
| `/devoluciones` | `/en/returns` |
| `/faq` | `/en/faq` |
| `/terminos` | `/en/terms` |
| `/envios` | `/en/shipping` |

Translation files and auxiliary scripts help prepare the resources required to build the localized versions.

## 🔄 HTTP Interceptors

The frontend uses interceptors to centralize cross-cutting concerns.

### Auth Interceptor

Attaches the authentication token when required.

### Loading Interceptor

Centralizes the loading state of HTTP requests.

### Error Interceptor

Centralizes HTTP request error handling.

### Retry Interceptor

Retries certain transient failures according to the rules defined in the code.

Requests that can produce side effects require special care to prevent duplicate operations during retries.

## 🧪 Testing

The project includes frontend and backend tests.

### Frontend

Tests cover services, components, and interceptors, including successful responses and HTTP error scenarios.

### Backend

The backend includes Vitest tests for different API areas, such as authentication, cart operations, health checks, and orders.

To run the backend tests:

```bash
cd backend-ecommerce
npm install
npm test
```

The test results and the number of passing tests should be verified by running the current test suite.

## 🚀 Local Setup and Installation

### Prerequisites

- A Node.js version compatible with Angular 18 and the project dependencies.
- npm.
- An accessible PostgreSQL instance.
- Git.

### 1. Clone the Repository

Once the repository has been published, replace the example URL with the actual GitHub repository URL:

```bash
git clone https://github.com/florc94/zenith-hardware.git
cd zenith-hardware
```

### 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend-ecommerce
npm install
```

### 4. Configure Environment Variables

Create `backend-ecommerce/.env` with your local environment settings.

Illustrative example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
```

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: secret used to sign JWTs, if this variable is used by the current authentication implementation.

Verify the exact environment variable names used by the code. Do not use the example values literally.

Do not commit `.env` files. Configure production environment variables through your hosting provider and use a secure secret.

### 5. Start the Backend

From `backend-ecommerce/`:

```bash
npm run dev
```

The default development port is `3000`, unless it has been changed in your local configuration.

### 6. Start the Frontend

Open another terminal and run this command from the project root:

```bash
npm start
```

The Angular development server is normally available at:

```text
http://localhost:4200
```

The English version may be available under `/en/`, depending on the localization and development-server configuration.

### 7. Build the Applications

From the project root:

```bash
npm run build
```

This command uses the scripts configured in the project to prepare translations and build Angular.

To compile the backend:

```bash
cd backend-ecommerce
npm run build
```

Building the backend and building the frontend are separate operations.

## 🔌 REST API

The API is organized around resources and uses routes, controllers, services, and middleware.

Main resources include:

| Resource | Functionality |
|---|---|
| `/api/auth` | Authentication |
| `/api/products` | Product catalog and administration |
| `/api/cart` | Shopping cart management |
| `/api/favorites` | Favorite products |
| `/api/orders` | Orders and tracking |
| `/api/reviews` | Product reviews |
| `/api/users` | Users |
| `/api/notifications` | Notifications |
| `/api/health` | Service health |

Examples of common operations:

```http
POST /api/auth/login

GET /api/products

GET /api/cart

GET /api/orders

GET /api/orders/:id
```

Available methods, parameters, and permissions depend on the routes implemented in the backend. Protected endpoints require the appropriate authentication and authorization.

## 🧠 Technical Decisions

### Frontend/Backend Architecture

Separating Angular and Express allows each layer to be developed and maintained independently.

### PostgreSQL

The relational database models related entities such as users, products, carts, and orders.

### Transactions

Database transactions help preserve consistency across operations involving multiple related changes.

### Angular Signals and RxJS

Reactive tools are used to manage application state and asynchronous service interactions.

### HTTP Interceptors

Interceptors centralize concerns such as authentication, loading indicators, error handling, and retries.

### Modular Organization

Organizing the application by feature improves maintainability, reuse, and extensibility.

## 🔮 Potential Improvements

- Integration with a real payment gateway.
- Password recovery and advanced session management.
- End-to-end testing.
- Accessibility improvements.
- Image optimization and storage.
- Expanded test coverage.
- Stricter validation of order status transitions.
- Improved observability and error logging.
- Continuous integration and delivery (CI/CD) pipeline.
- Documented production deployment and configuration.

## 🎯 Learning Objectives

This project provides hands-on experience with:

- Frontend development using Angular and TypeScript.
- Backend development using Node.js and Express.
- REST API design and integration.
- Relational databases and SQL.
- JWT-based authentication and authorization.
- Reactive state management and services.
- HTTP error handling.
- Internationalization.
- Software testing.
- Full-stack project organization.
- Version control with Git.

## 📄 License

This project was developed for educational and portfolio purposes. If the project is released under a specific license, add the corresponding license file and update this section.
