# 📦 Booking Service v2.0 - GraphQL + PostgreSQL

Microservicio de gestión de reservas refactorizado con GraphQL y PostgreSQL, diseñado siguiendo principios SOLID.

## 🎯 Cambios Principales

### De REST + MongoDB → GraphQL + PostgreSQL

| Aspecto | Anterior | Nuevo |
|---------|----------|-------|
| **API** | REST (Express) | GraphQL (Apollo Server) |
| **Base de datos** | MongoDB | PostgreSQL |
| **Transacciones** | No (schema loose) | ACID completas |
| **Arquitectura** | Monolítica | SOLID (capas) |
| **Puertos** | 5000 | 4000 |

## 📋 Estructura de Carpetas

```
booking-service/
├── src/
│   ├── config/               # Configuración
│   │   └── database.js       # Sequelize + PostgreSQL
│   ├── schema/               # Definiciones GraphQL
│   │   └── types.graphql.js  # Tipos y Query/Mutation
│   ├── resolvers/            # Orquestación GraphQL
│   │   └── booking.resolvers.js
│   ├── services/             # Lógica de negocio
│   │   └── BookingService.js
│   ├── repositories/         # Acceso a datos
│   │   └── BookingRepository.js
│   ├── clients/              # Integraciones HTTP
│   │   ├── UserClient.js     # Integración user-service
│   │   └── NotificationClient.js  # Integración notification-service
│   ├── middleware/           # Middleware
│   │   └── verifyToken.js    # Autenticación JWT
│   ├── models/               # Modelos Sequelize
│   │   └── Booking.js
│   ├── types/                # Tipos de datos
│   │   └── index.js
│   ├── utils/                # Utilidades
│   ├── migrations/           # Migraciones SQL
│   └── index.js              # Punto de entrada
├── Dockerfile                # Imagen Docker
├── package.json              # Dependencias
├── .env                       # Variables de entorno
└── README.md                  # Este archivo
```

## 🏗️ Arquitectura SOLID Implementada

### 1. **Single Responsibility Principle**
- `BookingRepository` → Acceso a datos
- `BookingService` → Lógica de negocio
- `Resolvers` → Orquestación GraphQL
- `Clients` → Integraciones externas

### 2. **Open/Closed Principle**
- Fácil agregar nuevos tipos de servicios (Resolver → Service → Repository)

### 3. **Liskov Substitution Principle**
- Clientes HTTP intercambiables

### 4. **Interface Segregation Principle**
- Métodos específicos en cada clase

### 5. **Dependency Inversion Principle**
- Services dependen de abstracciones (Repository)

## 🚀 Instalación

### Requisitos
- Node.js 20+
- PostgreSQL 16
- Docker (opcional)

### Instalación Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar PostgreSQL
# docker-compose up -d postgres

# 4. Ejecutar migraciones
npm run migrate

# 5. Iniciar en desarrollo
npm run dev

# Acceder a GraphQL Playground
# http://localhost:4000/graphql
```

## 📡 GraphQL API

### Queries

#### 1. Obtener todas las reservas del usuario
```graphql
query {
  bookings {
    success
    message
    bookings {
      id
      fecha
      fechaFormateada
      servicio
      estado
      createdAt
    }
  }
}
```

#### 2. Obtener próximas 5 reservas
```graphql
query {
  upcomingBookings {
    success
    bookings {
      id
      fecha
      fechaFormateada
      servicio
    }
  }
}
```

#### 3. Obtener una reserva por ID
```graphql
query {
  bookingById(id: "uuid-aqui") {
    id
    fecha
    fechaFormateada
    servicio
    estado
  }
}
```

#### 4. Obtener reservas canceladas
```graphql
query {
  cancelledBookings {
    bookings {
      id
      servicio
      canceladaEn
    }
  }
}
```

### Mutations

#### 1. Crear reserva
```graphql
mutation {
  createBooking(
    fecha: "2024-02-20T15:30:00"
    servicio: "hotel"
  ) {
    success
    message
    booking {
      id
      fecha
      fechaFormateada
      servicio
      estado
    }
  }
}
```

#### 2. Cancelar reserva
```graphql
mutation {
  cancelBooking(id: "uuid-aqui") {
    success
    message
    booking {
      id
      estado
      canceladaEn
    }
  }
}
```

#### 3. Eliminar reserva
```graphql
mutation {
  deleteBooking(id: "uuid-aqui") {
    success
    message
  }
}
```

## 🔐 Autenticación

Todas las queries y mutations requieren token JWT en el header:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ bookings { success } }"}'
```

## 🗄️ Base de Datos

### Schema PostgreSQL

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(255) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  servicio VARCHAR(255) NOT NULL,
  estado ENUM('activo', 'cancelada') DEFAULT 'activo',
  canceladaEn TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_userId (userId),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha)
);
```

## 🔄 Integraciones Externas

### UserClient
Verifica autenticación con `user-service`:
```javascript
const result = await userClient.validateUser(userId, token);
```

### NotificationClient
Envía notificaciones con `notification-service`:
```javascript
// Notificación de creación
await notificationClient.notifyBookingCreated(email, nombre, servicio, fecha);

// Notificación de cancelación
await notificationClient.notifyBookingCancelled(email, nombre, servicio, fecha);
```

## 🔐 Transacciones ACID

La operación de cancelación implementa transacciones ACID:

```javascript
// 1. Cambiar estado a 'cancelada'
// 2. Registrar canceladaEn
// 3. Si existen > 5 canceladas, eliminar las más antiguas
// (Todo en una transacción, si falla, se revierte)
// 4. Notificar por email
```

## 🐳 Docker

### Construir imagen
```bash
docker build -t booking-service:latest .
```

### Ejecutar con docker-compose
```bash
cd ..
docker-compose up -d booking-service
```

Acceso:
- GraphQL: http://localhost:4000/graphql

## ☸️ Kubernetes

Ver [k8s/DEPLOYMENT_GUIDE.md](../k8s/DEPLOYMENT_GUIDE.md) para guía completa.

```bash
# Desplegar todos los manifiestos
kubectl apply -f k8s/booking-service/

# Verificar estado
kubectl get pods -n microservices
kubectl logs -f deployment/booking-service -n microservices
```

## 📊 Variables de Entorno

```env
# Node
NODE_ENV=development
PORT=4000

# PostgreSQL
DB_HOST=localhost
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

## 🧪 Testing

```bash
# (Por implementar)
npm test

# Con cobertura
npm run test:coverage
```

## 📈 Logging y Monitoreo

- Los logs se envían a stdout (compatible con K8s)
- Cada operación registra inicio y fin
- Errores incluyen stack trace completo

Ejemplo:
```
✅ Conectado a PostgreSQL (Booking Service)
✅ Modelos sincronizados con la BD
✅ Booking Service corriendo en http://localhost:4000/graphql
```

## 🚢 Despliegue en Producción

Before deploying to production:

1. **Cambiar secretos** en `k8s/booking-service/00-namespace-config.yaml`
2. **Configurar TLS** en Ingress
3. **Habilitar HTTPS** en Apollo Server
4. **Configurar Prometheus** para métricas
5. **Implementar alertas** en Kubernetes
6. **Hacer backup** de PostgreSQL regularmente

## 📝 Changelog

### v2.0.0 (Actual)
- ✅ Migración a GraphQL (Apollo Server)
- ✅ Cambio de MongoDB a PostgreSQL
- ✅ Implementación de SOLID principles
- ✅ Transacciones ACID
- ✅ Manifiestos Kubernetes
- ✅ Health checks y livenessProbes
- ✅ Integración con user-service y notification-service

## 🤝 Contribuir

Por favor asegúrate de:
- Seguir la estructura SOLID
- Mantener la capa de repositorios abstracta
- Agregar logs apropiados
- Documentar cambios en GraphQL Schema

## 📝 Licencia

Parte de ReservasEC - Plataforma de reservas en producción

## 📧 Contacto

Para preguntas técnicas sobre la refactorización, contactar al equipo de DevOps.

---

**Última actualización:** 9 de febrero de 2026
