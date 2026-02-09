# 🚀 Guía de Despliegue en Kubernetes - Booking Service

## Prerequisitos

- Kubernetes 1.24+ (minikube, kind, o cluster real)
- kubectl instalado y configurado
- Helm (opcional, para gestionar valores)
- Docker/Buildkit para construir imagen

## Pasos de Despliegue

### 1. Construir la imagen Docker

```bash
# Desde la raíz del proyecto
cd booking-service
docker build -t booking-service:latest .

# Si usas un registry
docker tag booking-service:latest your-registry/booking-service:latest
docker push your-registry/booking-service:latest
```

### 2. Actualizar imagen en el Deployment (si necesario)

Edita `02-booking-service-deployment.yaml` y cambia:

```yaml
image: your-registry/booking-service:latest
```

### 3. Aplicar manifiestos en orden

```bash
# Aplicar todos los manifiestos
kubectl apply -f k8s/booking-service/

# O aplicar individualmente (recomendado primero):
# 1. Namespace, ConfigMap y Secrets
kubectl apply -f k8s/booking-service/00-namespace-config.yaml

# 2. PostgreSQL StatefulSet
kubectl apply -f k8s/booking-service/01-postgres-statefulset.yaml

# 3. Booking Service Deployment
kubectl apply -f k8s/booking-service/02-booking-service-deployment.yaml

# 4. Servicios y RBAC
kubectl apply -f k8s/booking-service/03-booking-service-service.yaml

# 5. Ingress (opcional)
kubectl apply -f k8s/booking-service/04-booking-service-ingress.yaml
```

### 4. Verificar estado de despliegue

```bash
# Ver namespace
kubectl get ns
kubectl describe ns microservices

# Ver StatefulSet de PostgreSQL
kubectl get statefulset -n microservices
kubectl describe statefulset postgres -n microservices

# Ver Deployments
kubectl get deployments -n microservices
kubectl describe deployment booking-service -n microservices

# Ver Pods
kubectl get pods -n microservices
kubectl logs -f pod/booking-service-xxxxx -n microservices

# Ver Services
kubectl get svc -n microservices

# Ver Ingress
kubectl get ingress -n microservices
```

### 5. Acceder a la aplicación

**Desde dentro del cluster:**
```
http://booking-service.microservices.svc.cluster.local:4000/graphql
```

**Desde fuera (NodePort):**
```
http://localhost:30400/graphql
```

**Con Ingress:**
```
http://booking.reservasec.local/graphql
# (requiere agregar a /etc/hosts)
```

## Debugging

### Ver logs
```bash
kubectl logs -f deployment/booking-service -n microservices
kubectl logs -f statefulset/postgres -n microservices
```

### Obtener información de eventos
```bash
kubectl describe pod <pod-name> -n microservices
kubectl get events -n microservices --sort-by='.lastTimestamp'
```

### Acceder a PostgreSQL
```bash
# Port-forward
kubectl port-forward service/postgres 5432:5432 -n microservices

# Desde otra terminal
psql -h localhost -U postgres -d bookingdb
```

### Verificar volúmenes
```bash
kubectl get pvc -n microservices
kubectl describe pvc postgres-pvc -n microservices
```

## Escalado

```bash
# Escalar despliegue
kubectl scale deployment booking-service --replicas=5 -n microservices

# Ver escalado automático (si está configurado)
kubectl get hpa -n microservices
```

## Actualizar despliegue

```bash
# Cambiar imagen o variable de entorno
kubectl set image deployment/booking-service \
  booking-service=your-registry/booking-service:v2 \
  -n microservices

# Verificar rollout
kubectl rollout status deployment/booking-service -n microservices

# Revertir si hay problemas
kubectl rollout undo deployment/booking-service -n microservices
```

## Limpiar recursos

```bash
# Eliminar todos los recursos del booking-service
kubectl delete -f k8s/booking-service/ -n microservices

# O eliminar namespace completo (elimina todo)
kubectl delete namespace microservices
```

## Configuración de Producción

⚠️ **Cambios requeridos para producción:**

1. **Secrets:**
   - Cambiar `JWT_SECRET`
   - Cambiar `DB_PASSWORD`
   - Usar Secret Management (AWS Secrets Manager, HashiCorp Vault, etc.)

2. **ConfigMap:**
   - Actualizar URLs de servicios externos
   - Cambiar `NODE_ENV` a `production`
   - Configurar logging apropiadamente

3. **Recursos:**
   - Aumentar `replicas` a 3 o más
   - Ajustar `resources.requests` y `limits`

4. **Autoscaling:**
   - Configurar HorizontalPodAutoscaler
   - Implementar Vertical Pod Autoscaler

5. **Seguridad:**
   - Usar RBAC con principio de menor privilegio
   - Configurar Network Policies
   - Implementar ServiceMesh (Istio)

6. **Monitoreo:**
   - Configurar Prometheus y Grafana
   - Implementar alertas
   - Configurar OpenTelemetry

7. **Backup:**
   - Configurar backups automáticos de PostgreSQL
   - Usar snapshots de volúmenes
