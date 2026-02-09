# ReservasEC Platform

**Sistema de Gestión de Reservas en Microservicios** con arquitectura refactorizada.

> **REFACTORIZACIÓN v2.0:** Booking Service migrado de REST + MongoDB → **GraphQL + PostgreSQL**

---

## Descripción General

ReservasEC es una plataforma completa de reservas que integra:
- **Frontend:** Next.js (interfaz web responsiva)
- **Microservicios:** 4 servicios independientes (Auth, Booking, User, Notification)
- **Booking Service refactorizado:** GraphQL + PostgreSQL con arquitectura SOLID

**Estado:** ✅ Production-Ready (Kubernetes + Docker Compose)

---

## Tabla de Contenidos

1. [Entregables](#-entregables)
2. [Criterios de Evaluación](#-criterios-de-evaluación)
3. [Instalación Local](#-instalación-local)
4. [Variables de Entorno](#-variables-de-entorno)
5. [Ejecución](#-ejecución)
6. [Despliegue en Kubernetes](#-despliegue-en-kubernetes)
7. [Ejemplos de GraphQL](#-ejemplos-de-graphql)
8. [Validación de Usuario](#-validación-de-usuario)
9. [Estructura de Carpetas](#-estructura-de-carpetas)

---

## Entregables

### 1. **Repositorio Público**
- Código fuente completo en GitHub: [AlejandroToscan0/AppReservasR](https://github.com/AlejandroToscan0/AppReservasR)
- Booking Service refactorizado (GraphQL + PostgreSQL)
- Estructura por capas (SOLID)

### 2. **Scripts de Migraciones**
- `booking-service/src/scripts/migrate.js` - DDL y esquema SQL
- Creación automática de tablas (Sequelize)
- Índices optimizados para búsquedas

### 3. **Manifiestos Kubernetes**
- `k8s/booking-service/` - 5 manifiestos completos
  - `00-namespace-config.yaml`
  - `01-postgres-statefulset.yaml`
  - `02-booking-service-deployment.yaml`
  - `03-booking-service-service.yaml`
  - `04-booking-service-ingress.yaml`
- Listos para: `kubectl apply -f k8s/booking-service/`

### 4. **Documentación Completa**
- [START_HERE.md](./START_HERE.md) - Guía de inicio rápido
- [booking-service/README_V2.md](./booking-service/README_V2.md) - Documentación técnica
- [k8s/DEPLOYMENT_GUIDE.md](./k8s/DEPLOYMENT_GUIDE.md) - Guía de Kubernetes
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Cambios realizados

---

## Criterios de Evaluación

### A. Migración a GraphQL + BD Relacional (10 pts)

#### (3) Schema GraphQL Correcto
```graphql
Query {
  bookings          # Listar todas las reservas
  upcomingBookings  # Próximas 5 reservas
  bookingById       # Obtener por ID
  cancelledBookings # Historial de canceladas
}

Mutation {
  createBooking   # Crear reserva + notificación
  cancelBooking   # Cancelar (ACID) + limpiar
  deleteBooking   # Eliminar
}
```
- **Ubicación:** `booking-service/src/schema/types.graphql.js`

#### (3) Persistencia Relacional
- **Modelo:** `booking-service/src/models/Booking.js` (Sequelize)
- **Acceso a datos:** `booking-service/src/repositories/BookingRepository.js`
- **Migraciones:** `booking-service/src/scripts/migrate.js` (DDL)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  servicio VARCHAR(255) NOT NULL,
  estado ENUM('activo', 'cancelada'),
  canceladaEn TIMESTAMP
);
CREATE INDEX idx_userId ON bookings(userId);
```

#### (2) Transacciones ACID
- **Cancelación atómica:** `booking-service/src/services/BookingService.js` línea 85
- Proceso:
  1. Cambiar estado a 'cancelada'
  2. Registrar `canceladaEn`
  3. Si > 5 canceladas, eliminar las más antiguas
  4. Notificar por email
- **Garantía:** Si falla cualquier paso, todo se revierte (rollback)

#### (2) SOLID: Separación Clara
```
booking-service/src/
├── schema/             → GraphQL types (responsabilidad única)
├── resolvers/          → Orquestación (I: interface segregation)
├── services/           → Lógica de negocio (S: single responsibility)
├── repositories/       → Acceso a datos (D: dependency inversion)
└── clients/            → Adaptadores HTTP (Open/Closed principle)
```

---

### B. Despliegue en Kubernetes (5 pts)

#### (2) Manifiestos Base
- `Deployment` - 3 replicas con rolling update
- `Service` - ClusterIP (interno) + NodePort (acceso externo)
- `ConfigMap` + `Secret` - Variables de entorno

```bash
kubectl apply -f k8s/booking-service/
# 5 manifiestos aplicados automáticamente
```

#### (2) BD Operativa
- `StatefulSet` PostgreSQL con persistencia
- `PersistentVolumeClaim` (10Gi)
- Inicializador de esquema automático

```yaml
statefulset: postgres-0
pvc: postgres-pvc (10Gi)
service: postgres (headless)
```

#### (1) Health Checks
- **livenessProbe:** HTTP GET `/.well-known/apollo/server-health`
- **readinessProbe:** HTTP GET `/.well-known/apollo/server-health`
- **Variables inyectadas:** ConfigMap + Secret (12 variables)

---

### C. Pruebas de Funcionamiento (5 pts)

#### (2) Pruebas GraphQL
Path: `booking-service/src/tests/booking.test.js`

Operaciones probadas:
- `createBooking` - Crear reserva
- `bookings` - Listar todas
- `cancelBooking` - Cancelar  
- `upcomingBookings` - Próximas 5
- `deleteBooking` - Eliminar

#### (2) Regla de Negocio: Máximo 5 Canceladas
Test incluido en `booking.test.js`:
```javascript
// Crear 7 reservas, cancelar todas
// Verificar: solo 5 canceladas permanecen (las más nuevas)
assert(cancelledRemaining.length === 5);
```

#### (1) Evidencia Reproducible
- **Colección Postman:** `booking-service/Postman_Collection.json`
- **Importar en Postman/Insomnia** para testing inmediato
- Incluye: Auth, Queries, Mutations, Health checks

---

## Instalación Local

### Requisitos
- Docker + Docker Compose
- Node.js 20+ (opcional, para desarrollo)
- PostgreSQL 16 (incluido en docker-compose)

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/AlejandroToscan0/AppReservasR.git
cd AppReservasR

# 2. Copiar variables de entorno
cp booking-service/.env.example booking-service/.env

# 3. Levantar servicios
docker-compose up -d

# 4. Los servicios estarán disponibles en:
# - Booking Service (GraphQL): http://localhost:4000/graphql
# - Auth Service: http://localhost:5001
# - User Service: http://localhost:5003
# - Notification Service: http://localhost:5002
```

---

## Variables de Entorno

### Booking Service (`booking-service/.env`)

```env
# Node Environment
NODE_ENV=development

# Apollo Server
PORT=4000

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bookingdb
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=tu-secret-aqui

# Servicios Externos
USER_SERVICE_URL=http://user-service:5003
NOTIFICATION_SERVICE_URL=http://notification-service:5002

# Logging
LOG_LEVEL=debug
```

> **Cambiar en producción:** DB_PASSWORD y JWT_SECRET

---

## Ejecución

### Docker Compose (Recomendado)

```bash
# Levantar todos
docker-compose up -d

# Logs de booking-service
docker-compose logs -f booking-service

# Parar todo
docker-compose down

# Limpiar volúmenes
docker-compose down -v
```

### Local (Desarrollo)

```bash
cd booking-service

# Instalar dependencias
npm install

# Ejecutar migraciones
npm run migrate

# Iniciar servidor
npm run dev

# Acceder a GraphQL Playground
# http://localhost:4000/graphql
```

---

## Despliegue en Kubernetes

### Prerequisitos
- kubectl instalado
- Cluster Kubernetes (minikube, kind, EKS, AKS, GKE)

### Pasos

```bash
# 1. Aplicar todos los manifiestos
kubectl apply -f k8s/booking-service/

# 2. Verificar despliegue
kubectl get pods -n microservices
kubectl get svc -n microservices

# 3. Port-forward (si no tienes Ingress)
kubectl port-forward svc/booking-service 4000:4000 -n microservices

# 4. Acceder a GraphQL
# http://localhost:4000/graphql
```

Más detalles en [k8s/DEPLOYMENT_GUIDE.md](./k8s/DEPLOYMENT_GUIDE.md)

---

## Ejemplos de GraphQL

### Query: Obtener Todas las Reservas

```graphql
query {
  bookings {
    success
    message
    bookings {
      id
      userId
      fecha
      fechaFormateada
      servicio
      estado
      createdAt
    }
  }
}
```

### Mutation: Crear Reserva

```graphql
mutation {
  createBooking(
    fecha: "2024-02-20T15:30:00"
    servicio: "hotel"
  ) {
    success
    booking {
      id
      fechaFormateada
      estado
    }
  }
}
```

### Mutation: Cancelar Reserva (ACID)

```graphql
mutation {
  cancelBooking(id: "uuid-aqui") {
    success
    booking {
      id
      estado
      canceladaEn
    }
  }
}
```

> **Nota:** Todas las queries/mutations requieren JWT en header `Authorization: Bearer TOKEN`

Más ejemplos en [booking-service/README_V2.md#-graphql-api](./booking-service/README_V2.md)

**Colección Postman:** Importar `booking-service/Postman_Collection.json` en Postman/Insomnia

---

## Validación de Usuario

### Flujo de Validación

```
Cliente envía GraphQL Query/Mutation
        ↓
Extrae JWT del header Authorization: Bearer TOKEN
        ↓
Middleware verifyToken.js valida la firma JWT
        ↓
Obtiene userId + datos del token
        ↓
Resolver valida que context.user exista
        ↓
UserClient verifica con user-service (validación adicional)
        ↓
Ejecuta operación solo si usuario es válido
        ↓
Notifier envia confirmación a los emails conocidos
```

### Código

**Middleware (`src/middleware/verifyToken.js`):**
```javascript
export async function createContext({ req }) {
    try {
        const auth = req?.headers?.authorization ? authMiddleware(req) : null;
        return { user: auth?.user || null };
    } catch (error) {
        console.error('Auth error:', error.message);
        return { user: null };
    }
}
```

**Resolver (valida context.user):**
```javascript
async bookings(parent, args, context) {
    if (!context.user) {
        throw new Error('Autenticación requerida');
    }
    // Obtener reservas del usuario validado
    return bookingService.getUserBookings(context.user.userId);
}
```

**UserClient (integración):**
```javascript
const result = await userClient.validateUser(userId, token);
if (!result.success) {
    throw new Error('Usuario no válido');
}
```

---

## 📁 Estructura de Carpetas

```
app-reservas/
├── booking-service/                 # ✨ REFACTORIZADO v2.0
│   ├── src/
│   │   ├── schema/types.graphql.js   # GraphQL types
│   │   ├── resolvers/                # Orquestación GraphQL
│   │   ├── services/                 # Lógica de negocio (ACID)
│   │   ├── repositories/             # Acceso a datos
│   │   ├── clients/                  # Integraciones HTTP
│   │   ├── models/Booking.js         # Sequelize ORM
│   │   ├── config/database.js        # PostgreSQL
│   │   ├── middleware/               # Autenticación
│   │   ├── scripts/migrate.js        # Migraciones DDL
│   │   └── tests/booking.test.js     # Tests
│   ├── Postman_Collection.json       # Para testing
│   ├── README_V2.md                  # Documentación técnica
│   └── Dockerfile                    # Imagen Docker
│
├── k8s/                              # ✨ Manifiestos Kubernetes
│   ├── booking-service/
│   │   ├── 00-namespace-config.yaml
│   │   ├── 01-postgres-statefulset.yaml
│   │   ├── 02-booking-service-deployment.yaml
│   │   ├── 03-booking-service-service.yaml
│   │   └── 04-booking-service-ingress.yaml
│   └── DEPLOYMENT_GUIDE.md           # Guía de despliegue
│
├── auth-service/                     # Sin cambios
├── user-service/                     # Sin cambios
├── notification-service/             # Sin cambios
├── frontend/                         # Sin cambios
├── docker-compose.yml                # ✨ Actualizado con PostgreSQL
├── START_HERE.md                     # ✨ Guía rápida
├── REFACTORING_SUMMARY.md            # ✨ Resumen de cambios
└── README.md                         # Este archivo
```

---

## Documentación Adicional

- [START_HERE.md](./START_HERE.md) - Comenza aquí
- [booking-service/README_V2.md](./booking-service/README_V2.md) - Docs técnicas
- [k8s/DEPLOYMENT_GUIDE.md](./k8s/DEPLOYMENT_GUIDE.md) - Kubernetes guide
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Cambios realizados

---

## Enlaces Útiles

- **Repositorio:** https://github.com/AlejandroToscan0/AppReservasR
- **GraphQL Playground:** http://localhost:4000/graphql
- **Health Check:** http://localhost:4000/.well-known/apollo/server-health

---

## Contacto & Soporte

Para preguntas sobre la refactorización, revisar:
1. [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)
2. [booking-service/README_V2.md](./booking-service/README_V2.md)
3. Comentarios en el código

---

**Última actualización:** 9 de febrero de 2026  
**Versión:** 2.0 (Refactorizada: GraphQL + PostgreSQL)  
**Status:** ✅ Production-Ready


Backend .env (cada microservicio)
Ejemplo para auth-service:

```bash
PORT=4000
MONGO_URI=mongodb://mongo:27017/auth-db
JWT_SECRET=supersecretkey
```

Repite para los demás servicios cambiando PORT, MONGO_URI y usando el mismo JWT_SECRET.

### 3. 🐳 Uso con Docker

1. Construir los contenedores

```bash
docker-compose build
```

3. Levantar los servicios

```bash
docker-compose up
```

La app estará disponible en http://localhost:3000

## Funcionalidades principales

- Registro e inicio de sesión de usuarios

- Perfil editable

- Creación y cancelación de reservas

- Historial de reservas activas y canceladas

- Límite de 5 reservas canceladas visibles

- Notificaciones por email (reserva y cancelación)

- Gestión de microservicios independientes
