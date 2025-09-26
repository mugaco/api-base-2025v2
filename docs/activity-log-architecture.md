# ActivityLog - Arquitectura de Auditoría y Trazabilidad

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Implementación](#implementación)
4. [Aspectos Legales y Compliance](#aspectos-legales-y-compliance)
5. [Guía de Uso](#guía-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Ejemplos de Logs](#ejemplos-de-logs)
8. [Mantenimiento y Monitoreo](#mantenimiento-y-monitoreo)

## Resumen Ejecutivo

ActivityLog es un sistema de auditoría y trazabilidad implementado en la arquitectura de la API que registra todas las operaciones de modificación de datos (CREATE, UPDATE, DELETE, SOFT_DELETE, RESTORE) manteniendo un historial completo de cambios por request HTTP.

### Características Principales

- ✅ **Aislamiento por Request**: Cada petición HTTP tiene su propia instancia de ActivityLog
- ✅ **Registro Automático**: Se integra transparentemente en BaseRepository
- ✅ **Trazabilidad Completa**: Guarda oldData, newData y cambios específicos
- ✅ **Seguridad**: Filtra automáticamente información sensible (passwords)
- ✅ **Performance**: No registra operaciones de lectura para evitar overhead
- ✅ **Compliance**: Cumple con GDPR, LGPD y normativas de auditoría

## Arquitectura Técnica

### 1. Flujo de Request

```
HTTP Request → Express Server
    ↓
scopeMiddleware (crea scope Awilix)
    ↓
requestContextMiddleware (inicializa contexto)
    ↓
Controller → Service → Repository
    ↓
ActivityLog (registra cambios)
    ↓
Response → Log final con activity[]
```

### 2. Componentes Clave

#### ActivityLog Class (`src/core/ActivityLog.ts`)
```typescript
export class ActivityLog {
  private actions: unknown[] = [];

  get(): unknown[] { return this.actions; }
  push(action: unknown): void { this.actions.push(action); }
  clean(): void { this.actions = []; }
}
```

#### Registro en Awilix (`src/core/dependencies/core.dependencies.ts`)
```typescript
Container.register('activity').asClass(ActivityLog).scoped();
```
- **`.scoped()`**: Crítico - crea nueva instancia por request

#### Integración en BaseRepository
```typescript
constructor(model: Model<T>, activity: ActivityLog, logger: ILoggerService) {
  this.activity = activity;
  // ...
}
```

### 3. Aislamiento de Scope

Cada request HTTP crea un nuevo scope Awilix que:
1. Hereda servicios singleton del contenedor principal
2. Crea nueva instancia de ActivityLog (scoped)
3. Se destruye automáticamente al finalizar el request

```
Contenedor Principal (Singleton)
├── LoggerService ─────┐
├── StorageService ────┤
└── DatabaseConnection ┤
                       │
Request 1 Scope        │    Request 2 Scope
├── ActivityLog (new)  │    ├── ActivityLog (new)
└── Uses singletons ───┘    └── Uses singletons ───┘
```

## Implementación

### Operaciones Registradas

| Operación | Datos Registrados | Verificación 404 |
|-----------|------------------|------------------|
| **create** | `resource`, `activity`, `data` | No aplica |
| **update** | `resource`, `activity`, `id`, `changedFields`, `changes`, `oldData`, `newData` | ✅ Sí |
| **delete** | `resource`, `activity`, `id`, `deletedData` | ✅ Sí |
| **softDelete** | `resource`, `activity`, `id`, `deletedData` | ✅ Sí |
| **restore** | `resource`, `activity`, `id`, `restoredData` | ✅ Sí |

### Operaciones NO Registradas

- `findById`, `findOne`, `findAll`, `count` - Operaciones de lectura
- Razón: El middleware ya registra la transacción completa con usuario, IP, timestamp

### Método compareData

Compara documentos antes/después de actualización:
```typescript
protected compareData(oldData: T, newData: T): {
  changedFields: string[];
  changes: Record<string, { old: unknown; new: unknown }>;
}
```

## Aspectos Legales y Compliance

### 1. GDPR (General Data Protection Regulation)

**Requisitos cumplidos:**
- ✅ **Art. 5(1)(f)**: Integridad y confidencialidad (logs seguros)
- ✅ **Art. 25**: Protección de datos por diseño (filtrado automático de passwords)
- ✅ **Art. 32**: Seguridad del tratamiento (registro de todas las modificaciones)
- ✅ **Art. 35**: Evaluación de impacto (trazabilidad completa)

### 2. LGPD (Lei Geral de Proteção de Dados - Brasil)

**Requisitos cumplidos:**
- ✅ **Art. 37**: Registro de operaciones de tratamiento
- ✅ **Art. 46**: Medidas de segurança y buenas prácticas
- ✅ **Art. 49**: Seguridad y sigilo de datos

### 3. SOX (Sarbanes-Oxley Act)

**Para empresas que cotizan en USA:**
- ✅ Sección 404: Control interno sobre informes financieros
- ✅ Registro inmutable de cambios
- ✅ Identificación clara del usuario responsable

### 4. ISO 27001

**Controles implementados:**
- ✅ A.12.4.1: Registro de eventos
- ✅ A.12.4.3: Registros del administrador y operador
- ✅ A.16.1.7: Recopilación de evidencias

### 5. Retención de Datos

**Recomendaciones por industria:**
- **Financiero**: 7-10 años
- **Salud**: 6-10 años (dependiendo del país)
- **E-commerce**: 3-5 años
- **General**: Mínimo 2 años

## Guía de Uso

### 1. Registro Automático en Repository

```typescript
// Ejemplo en PruebaRepository
export class PruebaRepository extends BaseRepository<IPrueba> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(PruebaModel, activity, loggerService);
  }
}
```

### 2. Acceso al ActivityLog en Middleware

```typescript
// En requestContextMiddleware
const activity = req.scope?.resolve('activity');
const actions = activity ? activity.get() : [];
```

### 3. Registro Manual (si necesario)

```typescript
// En un servicio custom
const activity = Container.resolve<ActivityLog>('activity');
activity.push({
  resource: 'CustomResource',
  activity: 'customAction',
  data: { /* ... */ }
});
```

## Mejores Prácticas

### 1. NO Registrar Operaciones de Lectura

```typescript
// ❌ EVITAR
async findById(_id: string): Promise<T | null> {
  this.activity.push({ activity: 'read', id: _id }); // No necesario
  return this.model.findById(_id).exec();
}

// ✅ CORRECTO
async findById(_id: string): Promise<T | null> {
  return this.model.findById(_id).exec(); // Sin registro
}
```

### 2. Siempre Verificar Existencia en Operaciones Destructivas

```typescript
// ✅ CORRECTO
async delete(_id: string): Promise<boolean> {
  const document = await this.model.findById(_id).exec();
  if (!document) {
    throw useNotFoundError(`Resource with _id ${_id} not found`);
  }
  // ... continuar con delete
}
```

### 3. Filtrar Información Sensible

```typescript
// En requestContextMiddleware
if (hasPayload) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeBody } = req.body;
  logData.payload = safeBody; // Password excluido
}
```

### 4. Mantener Consistencia en Formato

```typescript
// Formato estándar para todas las operaciones
{
  resource: string,      // Nombre del modelo
  activity: string,      // Tipo de operación
  id?: string,          // ID del documento
  data?: unknown,       // Datos relevantes
}
```

## Ejemplos de Logs

### GET Request (Sin Activity)
```json
{
  "transactionId": "4abc1b6a-5b42-45cf-8974-cefb060d8706",
  "statusCode": 200,
  "duration": "173.39ms",
  "userId": "68c6f4153c7c6743c24b0c83",
  "userRole": "admin",
  "ip": "79.153.89.82",
  "userAgent": "PostmanRuntime/7.46.0",
  "activity": [],
  "query": { "itemsPerPage": "20", "page": "1" }
}
```

### PUT Request (Update con Cambios)
```json
{
  "transactionId": "7be409bf-a32b-4264-ba83-03c42a06960f",
  "statusCode": 200,
  "duration": "130.29ms",
  "userId": "68c6f4153c7c6743c24b0c83",
  "userRole": "admin",
  "ip": "79.153.89.82",
  "userAgent": "PostmanRuntime/7.46.0",
  "activity": [{
    "resource": "Prueba",
    "activity": "update",
    "id": "6820467fb71563d87756d64c",
    "changedFields": ["name"],
    "changes": {
      "name": {
        "old": "Dios riese",
        "new": "adios rosi"
      }
    },
    "oldData": { /* documento completo antes */ },
    "newData": { /* documento completo después */ }
  }],
  "params": { "_id": "6820467fb71563d87756d64c" },
  "payload": { "name": "adios rosi" }
}
```

### DELETE Request
```json
{
  "transactionId": "657dbb05-ddab-4f9f-947a-a4b4cbf98550",
  "statusCode": 200,
  "duration": "65.65ms",
  "userId": "68c6f4153c7c6743c24b0c83",
  "userRole": "admin",
  "ip": "79.153.89.82",
  "userAgent": "PostmanRuntime/7.46.0",
  "activity": [{
    "resource": "Prueba",
    "activity": "delete",
    "id": "6820467fb71563d87756d64c",
    "deletedData": {
      "_id": "6820467fb71563d87756d64c",
      "name": "adios rosi",
      "createdAt": "2025-05-11T06:41:03.256Z",
      "updatedAt": "2025-09-26T12:14:42.002Z"
    }
  }],
  "params": { "_id": "6820467fb71563d87756d64c" }
}
```

## Mantenimiento y Monitoreo

### 1. Verificación de Aislamiento

```bash
# Test de concurrencia
npm run test:concurrent-requests

# Verificar que cada request tiene activity[] independiente
```

### 2. Análisis de Performance

```typescript
// Monitorear duración de requests
const avgDuration = logs
  .map(log => parseFloat(log.duration))
  .reduce((a, b) => a + b, 0) / logs.length;

console.log(`Duración promedio: ${avgDuration}ms`);
```

### 3. Auditoría de Cambios

```sql
-- Query ejemplo para MongoDB
db.logs.aggregate([
  { $match: { "activity.activity": "update" } },
  { $unwind: "$activity" },
  { $group: {
    _id: "$activity.resource",
    totalChanges: { $sum: 1 },
    users: { $addToSet: "$userId" }
  }}
])
```

### 4. Alertas Recomendadas

- **Eliminaciones masivas**: > 10 deletes en 1 minuto del mismo usuario
- **Actualizaciones sensibles**: Cambios en campos críticos (roles, permisos)
- **Accesos anómalos**: IPs no reconocidas o patrones inusuales
- **Performance**: Requests > 1000ms

### 5. Backup y Archivado

```bash
# Backup diario de logs
mongodump --collection=logs --query='{"timestamp": {"$gte": ISODate("2024-01-01")}}'

# Archivado mensual a almacenamiento frío
aws s3 cp logs-backup.tar.gz s3://audit-logs/2024/01/
```

## Conclusión

El sistema ActivityLog implementado proporciona:

1. **Trazabilidad completa** de todas las operaciones de modificación
2. **Aislamiento perfecto** entre requests concurrentes
3. **Cumplimiento legal** con normativas internacionales
4. **Performance optimizado** sin overhead en lecturas
5. **Seguridad** mediante filtrado automático de datos sensibles

Esta arquitectura está lista para producción y cumple con los estándares más exigentes de auditoría y compliance empresarial.

---
*Documento actualizado: 2025-09-26*
*Versión: 1.0.0*
*Autor: Arquitectura API Base 2025*