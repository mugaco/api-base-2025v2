# Documentación Completa de Funcionalidad GET

## 📋 Tabla de Contenidos
1. [Arquitectura](#arquitectura)
2. [Flujo de Datos](#flujo-de-datos)
3. [Parámetros Disponibles](#parámetros-disponibles)
4. [Sistema de Filtrado](#sistema-de-filtrado)
5. [Filtros Permanentes](#filtros-permanentes)
6. [Paginación](#paginación)
7. [Ordenación](#ordenación)
8. [Proyección de Campos](#proyección-de-campos)
9. [Límites de Seguridad](#límites-de-seguridad)
10. [Ejemplos Prácticos](#ejemplos-prácticos)
11. [Respuestas del Sistema](#respuestas-del-sistema)

## 🏗️ Arquitectura

El sistema GET está diseñado en capas para máxima flexibilidad y seguridad:

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP GET Request
       ▼
┌─────────────┐
│    Router   │ (PruebaRoutes.ts)
└──────┬──────┘
       │ controller.get()
       ▼
┌─────────────┐
│ Controller  │ (BaseController.ts)
└──────┬──────┘
       │ service.getPaginated()
       ▼
┌─────────────┐
│   Service   │ (BaseService.ts)
└──────┬──────┘
       │ repository.findPaginated()
       ▼
┌─────────────┐
│ Repository  │ (BaseRepository.ts)
└──────┬──────┘
       │ MongoDB Query
       ▼
┌─────────────┐
│   MongoDB   │
└─────────────┘
```

### Componentes Clave:

- **Router**: Define la ruta GET y llama al controlador
- **BaseController**: Procesa parámetros, maneja paginación y filtros
- **BaseService**: Lógica de negocio y transformaciones
- **BaseRepository**: Interacción con MongoDB, aplica permanentFilters
- **MongoQueryBuilder**: Construye queries complejas desde strings JSON

## 🔄 Flujo de Datos

### 1. Solicitud GET sin paginación:
```
GET /api/pruebas
→ BaseController.get()
→ handleGetRequest()
→ Detecta ausencia de 'page'
→ Aplica límite de seguridad (100 registros)
→ Service.getPaginated() con page:1, itemsPerPage:100
→ Repository con permanentFilters
→ Respuesta con data + info sobre límite
```

### 2. Solicitud GET con paginación:
```
GET /api/pruebas?page=2&itemsPerPage=20
→ BaseController.get()
→ handleGetRequest()
→ Detecta presencia de 'page'
→ extractPaginationParams()
→ Service.getPaginated()
→ Repository con permanentFilters
→ Respuesta con data + pagination
```

## 📊 Parámetros Disponibles

### Interface IGetQueryParams:
```typescript
interface IGetQueryParams {
  // Paginación
  page?: number;              // Activa paginación si está presente
  itemsPerPage?: number;      // Máximo 100 (aliases: items_per_page, items-per-page)

  // Ordenación
  sortBy?: string | string[]; // Campos para ordenar
  sortDesc?: boolean | boolean[]; // true = descendente

  // Proyección
  fields?: string;            // Campos a incluir (separados por comas)

  // Filtrado
  filters?: string;           // JSON con MongoQueryBuilder
  simpleSearch?: string;      // Búsqueda simple en campos específicos
}
```

## 🔍 Sistema de Filtrado

### 1. Filtros Simples (simpleSearch)

Búsqueda de texto en múltiples campos:

```javascript
// URL encoded
?simpleSearch={"search":"angular","fields":["nombre","descripcion"]}

// Genera MongoDB query:
{
  $or: [
    { nombre: { $regex: "angular", $options: "i" } },
    { descripcion: { $regex: "angular", $options: "i" } }
  ]
}
```

### 2. Filtros Complejos (filters)

Usando MongoQueryBuilder para queries avanzadas:

```javascript
// Filtros básicos
?filters={"estado":"activo","edad":{"$gte":18}}

// Filtros con operadores MongoDB
?filters={
  "nombre": {"$regex": "^Test", "$options": "i"},
  "fechaCreacion": {"$gte": "2025-01-01"},
  "tags": {"$in": ["javascript", "nodejs"]},
  "precio": {"$between": [100, 500]}
}

// Filtros con OR
?filters={
  "$or": [
    {"estado": "publicado"},
    {"esDestacado": true}
  ]
}
```

### 3. Combinación de Filtros

Los filtros se combinan con AND lógico:

```javascript
// simpleSearch + filters
?simpleSearch={"search":"test","fields":["nombre"]}&filters={"estado":"activo"}

// Resultado combinado:
{
  $or: [{ nombre: { $regex: "test", $options: "i" } }],
  estado: "activo"
}
```

## 🔒 Filtros Permanentes

Los filtros permanentes se aplican a TODAS las consultas y no se cuentan en totalRows.

### Definición en Repository:

```typescript
// UserRepository.ts
export class UserRepository extends BaseRepository<IUser> {
  constructor(...) {
    super(...);
    this.permanentFilters = {
      isActive: true  // Solo usuarios activos
    };
  }
}
```

### Comportamiento:

1. **Se aplican siempre**: No hay forma de desactivarlos desde el cliente
2. **Invisibles para totalRows**: Los registros filtrados no se cuentan
3. **Seguridad por defecto**: Útil para multi-tenancy, soft-delete, etc.

### Ejemplo Multi-Tenancy:

```typescript
// En un sistema multi-empresa
this.permanentFilters = {
  empresaId: req.user.empresaId  // Solo datos de la empresa del usuario
};
```

## 📄 Paginación

### Comportamiento Automático:

```javascript
// Sin parámetro 'page' - Límite de seguridad
GET /api/pruebas
→ Máximo 100 registros
→ Respuesta incluye info.limitApplied: true

// Con parámetro 'page' - Paginación activada
GET /api/pruebas?page=1&itemsPerPage=20
→ Página 1, 20 registros por página
→ Respuesta incluye pagination object
```

### Límites de Seguridad:

- **Sin paginación**: Máximo 100 registros
- **Con paginación**: itemsPerPage máximo 100
- **Validación**: Error 400 si itemsPerPage > 100

### Respuesta Paginada:

```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "itemsPerPage": 20,
    "totalFilteredRows": 45,  // Registros que cumplen los filtros
    "totalRows": 150,          // Total sin filtros (con permanentFilters)
    "pages": 3
  }
}
```

## 🔀 Ordenación

### Sintaxis:

```javascript
// Ordenar por un campo (ascendente por defecto)
?sortBy=nombre

// Ordenar descendente
?sortBy=nombre&sortDesc=true

// Múltiples campos
?sortBy=["categoria","precio"]&sortDesc=[false,true]
// Ordena por categoría ASC, luego precio DESC
```

### Formato MongoDB:

```javascript
// Se convierte a:
{ categoria: 1, precio: -1 }
```

## 🎯 Proyección de Campos

Selecciona qué campos incluir en la respuesta:

```javascript
// Solo campos específicos
?fields=nombre,email,fechaCreacion

// Se convierte a MongoDB projection:
{ nombre: 1, email: 1, fechaCreacion: 1 }
```

## 🛡️ Límites de Seguridad

### 1. Límite Sin Paginación:
- Máximo 100 registros automáticamente
- Mensaje informativo en la respuesta

### 2. Límite Con Paginación:
- itemsPerPage máximo 100
- Error 400 si se excede

### 3. Validaciones:
- page mínimo 1 (valores inválidos = 1)
- itemsPerPage mínimo 1 (valores inválidos = 10)

## 💡 Ejemplos Prácticos

### 1. Listado Simple
```bash
GET /api/pruebas
```
Respuesta:
```json
{
  "status": "success",
  "data": [...],  // Máximo 100 registros
  "info": {
    "message": "Se ha aplicado un límite automático de 100 registros...",
    "totalRows": 500,
    "limit": 100,
    "limitApplied": true
  }
}
```

### 2. Paginación Básica
```bash
GET /api/pruebas?page=2&itemsPerPage=25
```

### 3. Búsqueda Simple
```bash
GET /api/pruebas?simpleSearch={"search":"nodejs","fields":["titulo","tags"]}
```

### 4. Filtros Complejos
```bash
GET /api/pruebas?filters={"estado":"publicado","visitas":{"$gte":100},"categoria":{"$in":["tech","dev"]}}
```

### 5. Combo Completo
```bash
GET /api/pruebas?page=1&itemsPerPage=20&sortBy=fechaCreacion&sortDesc=true&filters={"estado":"activo"}&fields=titulo,autor,fecha
```

### 6. Búsqueda con Rango de Fechas
```bash
GET /api/pruebas?filters={"fechaCreacion":{"$gte":"2025-01-01","$lte":"2025-12-31"}}
```

### 7. Búsqueda con Regex
```bash
GET /api/pruebas?filters={"email":{"$regex":"@gmail\\.com$","$options":"i"}}
```

## 📦 Respuestas del Sistema

### 1. Respuesta Sin Paginación (con límite de seguridad):
```json
{
  "status": "success",
  "data": [
    { "_id": "1", "nombre": "Item 1", ... },
    { "_id": "2", "nombre": "Item 2", ... }
  ],
  "info": {
    "message": "Se ha aplicado un límite automático de 100 registros. Si necesita más registros, utilice paginación con los parámetros 'page' y 'itemsPerPage'.",
    "totalRows": 500,
    "limit": 100,
    "limitApplied": true
  }
}
```

### 2. Respuesta Con Paginación:
```json
{
  "status": "success",
  "data": [
    { "_id": "21", "nombre": "Item 21", ... },
    { "_id": "22", "nombre": "Item 22", ... }
  ],
  "pagination": {
    "page": 2,
    "itemsPerPage": 20,
    "totalFilteredRows": 85,
    "totalRows": 500,
    "pages": 5
  }
}
```

### 3. Error de Límite Excedido:
```json
{
  "status": "error",
  "message": "El parámetro itemsPerPage no puede superar 100. Valor solicitado: 200",
  "errors": [
    {
      "field": "itemsPerPage",
      "message": "El valor máximo permitido es 100. Utilice paginación para obtener más registros."
    }
  ]
}
```

### 4. Error de Filtro Inválido:
```json
{
  "status": "error",
  "message": "Formato JSON inválido para simpleSearch",
  "errors": []
}
```

## 🔧 Configuración de Filtros Permanentes

### Caso de Uso: Soft Delete
```typescript
// PruebaRepository.ts
constructor() {
  super();
  this.permanentFilters = { isDeleted: false };
}
```

### Caso de Uso: Multi-Tenancy
```typescript
// En un sistema SaaS
constructor(private context: RequestContext) {
  super();
  this.permanentFilters = {
    tenantId: context.getTenantId()
  };
}
```

### Caso de Uso: Visibilidad por Rol
```typescript
// Solo contenido publicado para usuarios normales
constructor(private user: IUser) {
  super();
  if (!user.isAdmin) {
    this.permanentFilters = {
      estado: 'publicado',
      fechaPublicacion: { $lte: new Date() }
    };
  }
}
```

## 🚀 Mejores Prácticas

### 1. **Usar Paginación Siempre**
   - Evita cargar grandes volúmenes de datos
   - Mejora el rendimiento del cliente y servidor

### 2. **Filtros Específicos**
   - Usa `filters` para consultas complejas
   - `simpleSearch` solo para búsquedas de texto

### 3. **Proyección de Campos**
   - Reduce el tamaño de la respuesta
   - Especialmente útil en listas con muchos campos

### 4. **Índices MongoDB**
   - Crea índices para campos usados en sortBy
   - Índices compuestos para filtros frecuentes

### 5. **Filtros Permanentes**
   - Úsalos para seguridad y multi-tenancy
   - No para lógica de negocio variable

## 📝 Notas Técnicas

### MongoQueryBuilder
- Parsea strings JSON a queries MongoDB válidas
- Soporta todos los operadores de MongoDB
- Validación automática de sintaxis

### Performance
- Las consultas usan índices cuando están disponibles
- `permanentFilters` se aplican primero para optimización
- Proyección reduce transferencia de datos

### Seguridad
- Validación de todos los parámetros de entrada
- Límites estrictos para prevenir DoS
- Filtros permanentes para aislamiento de datos

---

## 📚 Referencias

- [BaseController.ts](/src/core/base/BaseController.ts)
- [BaseRepository.ts](/src/core/base/BaseRepository.ts)
- [MongoQueryBuilder.ts](/src/core/utils/MongoQueryBuilder.ts)
- [IGetQueryParams.ts](/src/core/base/interfaces/GetQueryParams.interface.ts)

---

*Última actualización: 2025-09-26*