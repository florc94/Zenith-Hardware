# Zenith Hardware — Full Stack E-commerce

🇪🇸 Español | [🇬🇧 English](./README.en.md)

Zenith Hardware es una aplicación de **e-commerce full stack** desarrollada con Angular, Node.js, Express y PostgreSQL. El proyecto integra una experiencia de compra, autenticación de usuarios, gestión de pedidos y un panel administrativo en una arquitectura frontend/backend conectada mediante una API REST.

El objetivo es aplicar buenas prácticas de desarrollo, organización modular, persistencia de datos, seguridad, manejo de errores e internacionalización en una aplicación inspirada en un escenario real de comercio electrónico.

## ✨ Características principales

### 🛍️ Experiencia de compra

- Catálogo de productos con categorías.
- Búsqueda y consulta de productos.
- Visualización de precios y disponibilidad.
- Detalle de productos.
- Carrito de compras con gestión de cantidades.
- Persistencia del carrito para usuarios autenticados.
- Comparación de productos.
- Lista de favoritos.
- Proceso de checkout.
- Creación e historial de pedidos.
- Consulta de detalles y seguimiento de pedidos.
- Secciones informativas de envíos, devoluciones, sucursales, preguntas frecuentes y términos.
- Interfaz adaptable a diferentes tamaños de pantalla.

### 🔐 Autenticación y autorización

- Registro e inicio de sesión.
- Autenticación basada en JSON Web Tokens (JWT).
- Interceptor HTTP para enviar el token de autenticación.
- Protección de rutas según el estado de autenticación.
- Roles de usuario y administrador.
- Middleware de autenticación y autorización en el backend.
- Restricción de acceso a recursos según usuario y permisos.

### 🧑‍💼 Panel de administración

- Creación, edición y eliminación de productos.
- Consulta y gestión de pedidos.
- Visualización de pedidos en formato Kanban y lista.
- Búsqueda y consulta del detalle de pedidos.
- Actualización individual y masiva de estados.
- Paginación del lado del servidor.
- Dashboard con métricas de pedidos.
- Gestión y consulta de usuarios.

### ⚙️ Funcionalidades de backend

- API REST desarrollada con Express y TypeScript.
- Persistencia de datos en PostgreSQL.
- Consultas SQL mediante el cliente `pg`.
- Manejo centralizado de errores.
- Middleware para autenticación y autorización.
- Gestión de carrito, favoritos y pedidos.
- Actualización de stock durante la creación de pedidos.
- Transacciones para operaciones relacionadas con pedidos.
- Servicios de notificaciones y correo electrónico.
- Proceso automatizado de avance de pedidos.

## 🧰 Stack tecnológico

### Frontend

- Angular 18
- TypeScript
- HTML5 y SCSS
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
- `node-cron`, para las tareas programadas si está habilitado en la configuración actual

### Testing

- Vitest para el backend.
- Pruebas unitarias del backend con los módulos de test existentes.
- Pruebas de componentes y servicios Angular.
- Pruebas de interceptores HTTP y manejo de errores.

### Herramientas y despliegue

- Git y GitHub
- npm
- Docker
- Docker Compose
- Nginx
- PostgreSQL

## 🏗️ Arquitectura

El proyecto está organizado en un único repositorio que contiene dos aplicaciones principales:

```text
zenith-hardware/
├── src/                    # Frontend Angular
├── backend-ecommerce/      # Backend Express
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── tests/
├── scripts/                # Scripts auxiliares
├── angular.json
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── README.md
└── README.en.md
```

La comunicación entre ambas aplicaciones se realiza mediante HTTP y JSON.

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

Esta separación permite mantener las responsabilidades del cliente, la lógica de negocio y la persistencia de datos desacopladas.

## 🖥️ Frontend

El frontend utiliza una arquitectura modular organizada por funcionalidades.

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

Contiene funcionalidades compartidas por distintas áreas de la aplicación:

- Servicios de autenticación.
- Guards para proteger rutas.
- Interceptores HTTP.
- Estado global de carga.
- Notificaciones.
- Modelos de datos y utilidades comunes.

### Features

Cada módulo agrupa componentes, servicios y modelos relacionados con una funcionalidad específica, facilitando el mantenimiento y la evolución de la aplicación.

### Diseño adaptable

La interfaz utiliza Angular, HTML y SCSS para organizar sus componentes y adaptar la experiencia a dispositivos de escritorio y móviles.

## 🔐 Autenticación

El flujo de autenticación utiliza JWT.

```text
Usuario
   │
   ▼
POST /api/auth/login
   │
   ▼
Validación de credenciales
   │
   ▼
Emisión del token JWT
   │
   ▼
Frontend autenticado
   │
   ▼
Auth Interceptor
   │
   ▼
Authorization: Bearer <token>
```

El frontend utiliza un interceptor para adjuntar el token cuando corresponde. En el backend, los middleware verifican la autenticación y los permisos necesarios para acceder a los recursos protegidos.

**Nota de seguridad:** la autorización debe validarse en el backend, independientemente de las rutas protegidas de Angular.

## 🛒 Carrito de compras

El carrito permite agregar productos, modificar cantidades y eliminar artículos.

Para usuarios autenticados, el backend gestiona la persistencia de los elementos en PostgreSQL mediante los endpoints de carrito y los servicios correspondientes.

El frontend utiliza `CartService` y estado reactivo para mantener actualizada la interfaz.

## ❤️ Favoritos y comparación de productos

La aplicación incorpora funcionalidades para guardar productos favoritos y comparar características entre distintos artículos.

Estas herramientas complementan la experiencia de compra y facilitan la evaluación de productos antes de tomar una decisión.

## 💳 Checkout y gestión de pedidos

El proceso de compra integra el carrito con la creación de pedidos.

El flujo general es:

```text
Carrito
   │
   ▼
Checkout
   │
   ▼
Validación de la operación
   │
   ▼
Creación del pedido
   ├── Registro del pedido
   ├── Registro de los artículos
   ├── Actualización de stock
   └── Actualización del carrito
   │
   ▼
Confirmación de la transacción
```

Las operaciones que se ejecutan dentro de una transacción de PostgreSQL pueden revertirse si ocurre un error antes de confirmar los cambios.

Los pedidos almacenan información relacionada con el usuario, los productos, las cantidades, los importes, el estado y los datos de seguimiento disponibles.

El checkout de este proyecto es una implementación de práctica; no implica que exista una pasarela de pagos real integrada.

## 📦 Estados de los pedidos

El flujo de estados contempla las etapas principales del procesamiento de un pedido:

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

Los pedidos también pueden pasar a un estado final de cancelación cuando corresponda.

El panel administrativo permite consultar pedidos y actualizar sus estados. Las acciones disponibles dependen del estado actual y de las reglas de la aplicación.

## ⏱️ Automatización de pedidos

El backend contiene un servicio para automatizar el avance de pedidos mediante tareas programadas.

El objetivo es simular etapas del procesamiento logístico y reducir la necesidad de actualizar manualmente cada pedido durante las pruebas.

Los intervalos, estados y condiciones exactas dependen de la configuración del servicio. Para un entorno de producción, estas transiciones deben respetar reglas de negocio explícitas y considerar el comportamiento cuando se ejecutan varias instancias del backend.

## 📊 Dashboard administrativo

El dashboard reúne indicadores relacionados con la actividad de la tienda.

Entre las métricas contempladas se encuentran:

- Cantidad de pedidos.
- Ingresos registrados.
- Ingresos del mes.
- Valor promedio por pedido.
- Distribución de pedidos por estado.

Los datos se obtienen a través de servicios del backend y se presentan en la interfaz administrativa.

## 📄 Paginación del lado del servidor

La aplicación utiliza paginación en el backend para evitar descargar todos los registros cuando solo se necesita una página.

Ejemplo ilustrativo de consulta:

```http
GET /api/orders?page=1&limit=10
```

El backend puede aplicar `LIMIT` y `OFFSET` en las consultas SQL para devolver el conjunto solicitado y los metadatos de paginación que consuma el frontend.

Esto resulta útil a medida que crece el volumen de pedidos.

## 🌍 Internacionalización

Zenith Hardware contempla dos idiomas:

- 🇪🇸 Español
- 🇬🇧 English

La aplicación utiliza Angular Localize y archivos de traducción XLIFF.

Las rutas principales se encuentran localizadas, por ejemplo:

| Español | English |
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

Los archivos de traducción y los scripts auxiliares permiten preparar los recursos necesarios para generar las versiones localizadas.

## 🔄 Interceptores HTTP

El frontend dispone de interceptores para centralizar tareas transversales.

### Auth Interceptor

Adjunta el token de autenticación cuando la solicitud lo requiere.

### Loading Interceptor

Permite centralizar el estado de carga de las solicitudes HTTP.

### Error Interceptor

Centraliza el tratamiento de errores de las peticiones.

### Retry Interceptor

Implementa reintentos para determinados errores transitorios, según las reglas definidas en el código.

Las solicitudes que pueden producir efectos secundarios requieren especial cuidado para evitar duplicar operaciones durante un reintento.

## 🧪 Testing

El proyecto incluye pruebas del frontend y del backend.

### Frontend

Existen pruebas para servicios, componentes e interceptores, incluyendo escenarios de respuestas exitosas y errores HTTP.

### Backend

El backend incluye pruebas con Vitest para distintas áreas de la API, como autenticación, carrito, salud del servicio y pedidos.

Para ejecutar las pruebas del backend:

```bash
cd backend-ecommerce
npm install
npm test
```

Los resultados y la cantidad de pruebas aprobadas deben comprobarse ejecutando la suite en el entorno actual.

## 🚀 Instalación y ejecución local

### Requisitos previos

- Node.js compatible con Angular 18 y las dependencias del proyecto.
- npm.
- Una instancia de PostgreSQL accesible.
- Git.

### 1. Clonar el repositorio

Una vez publicado el repositorio, reemplazá la URL de ejemplo por la URL real de GitHub:

```bash
git clone https://github.com/florc94/zenith-hardware.git
cd zenith-hardware
```

### 2. Instalar dependencias del frontend

Desde la raíz:

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd backend-ecommerce
npm install
```

### 4. Configurar las variables de entorno

Creá `backend-ecommerce/.env` con los valores de tu entorno local.

Ejemplo ilustrativo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
```

- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `JWT_SECRET`: clave para firmar tokens JWT, si la implementación de autenticación utiliza esta variable.

Verificá los nombres exactos de las variables utilizadas por el código. No uses los valores de ejemplo literalmente.

El archivo `.env` no debe publicarse. Configurá las variables de producción en el proveedor de hosting y utilizá una clave secreta segura.

### 5. Iniciar el backend

Desde `backend-ecommerce/`:

```bash
npm run dev
```

El puerto configurado por defecto en el entorno de desarrollo es `3000`, salvo que se haya modificado en la configuración local.

### 6. Iniciar el frontend

En otra terminal, desde la raíz del proyecto:

```bash
npm start
```

El servidor de desarrollo de Angular normalmente estará disponible en:

```text
http://localhost:4200
```

La versión inglesa puede estar disponible bajo `/en/`, según la configuración de localización y el servidor de desarrollo.

### 7. Generar una build

Desde la raíz:

```bash
npm run build
```

Este comando utiliza los scripts configurados en el proyecto para preparar las traducciones y generar la build de Angular.

Para compilar el backend:

```bash
cd backend-ecommerce
npm run build
```

La compilación del backend y la generación de la build del frontend son operaciones independientes.

## 🔌 API REST

La API está organizada por recursos y utiliza rutas, controladores, servicios y middleware.

Entre los recursos principales se encuentran:

| Recurso | Funcionalidad |
|---|---|
| `/api/auth` | Autenticación |
| `/api/products` | Catálogo y administración de productos |
| `/api/cart` | Gestión del carrito |
| `/api/favorites` | Productos favoritos |
| `/api/orders` | Pedidos y seguimiento |
| `/api/reviews` | Reseñas |
| `/api/users` | Usuarios |
| `/api/notifications` | Notificaciones |
| `/api/health` | Estado del servicio |

Ejemplos de operaciones habituales:

```http
POST /api/auth/login

GET /api/products

GET /api/cart

GET /api/orders

GET /api/orders/:id
```

Los métodos, parámetros y permisos disponibles dependen de las rutas implementadas en el backend. Los endpoints protegidos requieren la autenticación y autorización correspondientes.

## 🧠 Decisiones técnicas

### Arquitectura frontend/backend

La separación de Angular y Express permite desarrollar y mantener cada capa de forma independiente.

### PostgreSQL

La base de datos relacional permite representar entidades relacionadas, como usuarios, productos, carritos y pedidos.

### Transacciones

Las transacciones ayudan a mantener la consistencia de las operaciones que involucran varios cambios relacionados.

### Angular Signals y RxJS

Se utilizan herramientas reactivas para gestionar estado e interacción con servicios asíncronos.

### Interceptores HTTP

Centralizan tareas como autenticación, indicadores de carga, manejo de errores y reintentos.

### Organización modular

La división por funcionalidades facilita el mantenimiento, la reutilización y la incorporación de nuevas características.

## 🔮 Posibles mejoras

- Integración con una pasarela de pagos real.
- Recuperación de contraseña y gestión avanzada de sesiones.
- Pruebas end-to-end.
- Mejoras de accesibilidad.
- Optimización y almacenamiento de imágenes.
- Ampliación de la cobertura de tests.
- Validaciones más estrictas de las transiciones de pedidos.
- Mejoras de observabilidad y registro de errores.
- Pipeline de integración y entrega continua (CI/CD).
- Despliegue y configuración de producción documentados.

## 🎯 Objetivos de aprendizaje

Este proyecto permite practicar y demostrar conocimientos en:

- Desarrollo frontend con Angular y TypeScript.
- Desarrollo backend con Node.js y Express.
- Diseño e integración de APIs REST.
- Bases de datos relacionales y SQL.
- Autenticación y autorización con JWT.
- Gestión de estado y servicios reactivos.
- Manejo de errores HTTP.
- Internacionalización.
- Pruebas de software.
- Organización de un proyecto full stack.
- Control de versiones con Git.

## 📄 Licencia

Proyecto desarrollado con fines educativos y de portfolio. Si se publica bajo una licencia específica, debe incorporarse el archivo de licencia correspondiente y actualizarse esta sección.
