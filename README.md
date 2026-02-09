# ReservasEC Platform

**Sistema de Gestión de Reservas en Microservicios** con arquitectura refactorizada.

> **REFACTORIZACIÓN v2.0:** Booking Service migrado de REST + MongoDB → **GraphQL + PostgreSQL**

---

## Descripción General

ReservasEC es una plataforma completa de reservas que integra:
- **Frontend:** Next.js (interfaz web responsiva)
- **Microservicios:** 4 servicios independientes (Auth, Booking, User, Notification)
- **Booking Service refactorizado:** GraphQL + PostgreSQL con arquitectura SOLID

**Estado:** Production-Ready (Kubernetes + Docker Compose)

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
- kubectl instalado y configurado
- Cluster Kubernetes activo (minikube, kind, EKS, AKS, GKE, etc.)
- Docker para construir images (o usar registry existente)
- Permisos para crear resources en el cluster

### Verificación de Prerequisitos

```bash
# Verificar kubectl
kubectl version --client

# Verificar cluster
kubectl cluster-info

# Verificar contexto actual
kubectl config current-context

# Listar clusters disponibles
kubectl config get-contexts
```

### Pasos de Despliegue (Paso a Paso)

#### 1️⃣ **Construir y publicar la imagen del Booking Service**

```bash
# Opción A: Usar Docker Hub o tu registry privado
cd booking-service
docker build -t tu-registry/booking-service:v2.0 .
docker push tu-registry/booking-service:v2.0

# Opción B: Usar registro local de minikube
eval $(minikube docker-env)
docker build -t booking-service:v2.0 .
```

#### 2️⃣ **Actualizar referencia de imagen en Deployment (si necesario)**

Si usaste un registry personalizado, actualiza `k8s/booking-service/02-booking-service-deployment.yaml`:

```yaml
containers:
  - name: booking-service
    image: tu-registry/booking-service:v2.0  # <-- Cambiar aquí
    imagePullPolicy: Always
```

#### 3️⃣ **Crear Namespace (si no existe)**

```bash
kubectl create namespace microservices
# o dejar que se cree automáticamente:
kubectl apply -f k8s/booking-service/00-namespace-config.yaml
```

#### 4️⃣ **Aplicar todos los manifiestos en orden**

```bash
# Opción 1: Aplicar todo de una vez
kubectl apply -f k8s/booking-service/

# Opción 2: Aplicar en orden específico (recomendado)
kubectl apply -f k8s/booking-service/00-namespace-config.yaml
sleep 2
kubectl apply -f k8s/booking-service/01-postgres-statefulset.yaml
sleep 10  # Esperar a que PostgreSQL esté ready
kubectl apply -f k8s/booking-service/02-booking-service-deployment.yaml
kubectl apply -f k8s/booking-service/03-booking-service-service.yaml
kubectl apply -f k8s/booking-service/04-booking-service-ingress.yaml
```

#### 5️⃣ **Verificar despliegue**

```bash
# Ver estado del namespace
kubectl get all -n microservices

# Ver pods
kubectl get pods -n microservices -w  # -w para ver cambios en vivo

# Ver si PostgreSQL está ready
kubectl get statefulset -n microservices

# Ver servicios
kubectl get svc -n microservices

# Ver eventos (útil para debugging)
kubectl get events -n microservices --sort-by='.lastTimestamp'
```

#### 6️⃣ **Acceder al servicio**

**Opción A: Port-forward (rápida)**
```bash
kubectl port-forward svc/booking-service 4000:4000 -n microservices
# Acceder a: http://localhost:4000/graphql
```

**Opción B: NodePort (requiere exposición del nodo)**
```bash
# El servicio ya está expuesto en puerto 30400
# Obtén la IP del nodo:
kubectl get nodes -o wide

# Accede a: http://<NODE_IP>:30400/graphql
```

**Opción C: Ingress (requiere Ingress Controller)**
```bash
# Edita hosts (solo para desarrollo local)
echo "127.0.0.1 booking.reservasec.local" >> /etc/hosts

# Usa el ingress:
# http://booking.reservasec.local/graphql
```

---

### Verificación de Salud

```bash
# Health check del Pod
kubectl exec -it booking-service-<POD_ID> -n microservices -- \
  curl http://localhost:4000/.well-known/apollo/server-health

# Logs del Booking Service
kubectl logs -n microservices svc/booking-service -f

# Logs de PostgreSQL
kubectl logs -n microservices statefulset/postgres -f

# Describir un Pod (útil si está en estado CrashLoopBackOff)
kubectl describe pod booking-service-<POD_ID> -n microservices
```

---

### Configuración Avanzada

#### Escalar Booking Service
```bash
# Aumentar replicas
kubectl scale deployment booking-service --replicas=5 -n microservices

# Ver escalado
kubectl get deployment booking-service -n microservices
```

#### Actualizar imagen (Rolling Update)
```bash
# Actualizar imagen
kubectl set image deployment/booking-service \
  booking-service=tu-registry/booking-service:v2.1 \
  -n microservices

# Ver progreso
kubectl rollout status deployment/booking-service -n microservices
```

#### Rollback a versión anterior
```bash
kubectl rollout undo deployment/booking-service -n microservices
```

#### Verificar estado de PersistentVolumeClaim
```bash
kubectl get pvc -n microservices
kubectl describe pvc postgres-pvc -n microservices
```

---

### Variables de Entorno en Kubernetes

Las variables se inyectan desde:
- **ConfigMap** `booking-service-config` → variables públicas
- **Secret** `booking-service-secret` → credenciales sensibles

Para actualizar:
```bash
# Actualizar ConfigMap
kubectl edit configmap booking-service-config -n microservices

# Actualizar Secret
kubectl patch secret booking-service-secret -n microservices \
  -p '{"data":{"DB_PASSWORD":"'$(echo -n "newpassword" | base64)'"}}'

# Reiniciar pods para aplicar cambios
kubectl rollout restart deployment/booking-service -n microservices
```

---

### Troubleshooting

**Pod en estado Pending:**
```bash
kubectl describe pod <POD_NAME> -n microservices
# Revisar: recursos, nodos disponibles, PVC
```

**Pod en estado CrashLoopBackOff:**
```bash
kubectl logs <POD_NAME> -n microservices --tail=100
# Revisar errores de aplicación
```

**PostgreSQL no se conecta:**
```bash
# Verificar que StatefulSet está running
kubectl get statefulset -n microservices

# Verificar logs de PostgreSQL
kubectl logs postgres-0 -n microservices

# Conectarse directamente a PostgreSQL
kubectl exec -it postgres-0 -n microservices -- psql -U postgres
```

**Graphql endpoint no responde:**
```bash
# Verificar healthcheck
kubectl exec -it <BOOKING_POD> -n microservices -- \
  curl -v http://localhost:4000/.well-known/apollo/server-health

# Ver logs
kubectl logs <BOOKING_POD> -n microservices -f
```

---

### Limpieza

```bash
# Eliminar todos los recursos del namespace
kubectl delete namespace microservices

# Eliminar solo ciertos resources
kubectl delete deployment booking-service -n microservices
kubectl delete statefulset postgres -n microservices
```

---

## Testing Backend

### 1. Crear Usuario (Auth Service)

```bash
curl -X POST http://localhost:5001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "message": "Usuario registrado correctamente",
  "userId": "698a1ff65595d2fd69c9bb54"
}
```

### 2. Acceder a GraphQL Apollo Studio

**URL:** http://localhost:4000/graphql

O click en: [Query your server](https://studio.apollographql.com/sandbox?endpoint=http%3A%2F%2Flocalhost%3A4000%2Fgraphql)

---

## Ejemplos de GraphQL

### Query: Obtener Todas las Reservas

```graphql
query {
  bookings {
    id
    userId
    fecha
    servicio
    estado
    createdAt
  }
}
```

### Query: Reservas Próximas

```graphql
query {
  upcomingBookings {
    id
    userId
    fecha
    servicio
    estado
  }
}
```

### Query: Obtener Reserva por ID

```graphql
query {
  bookingById(id: "UUID_AQUI") {
    id
    userId
    fecha
    servicio
    estado
    canceladaEn
    createdAt
  }
}
```

### Mutation: Crear Reserva

```graphql
mutation {
  createBooking(input: {
    userId: "698a1ff65595d2fd69c9bb54"
    fecha: "2025-03-15"
    servicio: "Hotel Quito"
  }) {
    id
    userId
    fecha
    servicio
    estado
    createdAt
  }
}
```

### Mutation: Cancelar Reserva (ACID)

```graphql
mutation {
  cancelBooking(id: "RESERVATION_ID_AQUI") {
    id
    estado
    canceladaEn
  }
}
```

### Mutation: Eliminar Reserva

```graphql
mutation {
  deleteBooking(id: "RESERVATION_ID_AQUI")
}
```

**Nota sobre Transacciones ACID:** Al cancelar una reserva:
1. Cambia estado a "cancelada"
2. Registra timestamp en `canceladaEn`
3. Si ya hay más de 5 canceladas, limpia automáticamente
4. Envía notificación al usuario

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
├── booking-service/                 # REFACTORIZADO v2.0
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
├── k8s/                              # Manifiestos Kubernetes
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
├── docker-compose.yml                # Actualizado con PostgreSQL
├── START_HERE.md                     # Guía rápida
├── REFACTORING_SUMMARY.md            # Resumen de cambios
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
**Status:** Production-Ready


Backend .env (cada microservicio)
Ejemplo para auth-service:

```bash
PORT=4000
MONGO_URI=mongodb://mongo:27017/auth-db
JWT_SECRET=supersecretkey
```

Repite para los demás servicios cambiando PORT, MONGO_URI y usando el mismo JWT_SECRET.

### 3. Uso con Docker

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
