# Reglas Fundamentales de Arquitectura

## 🎯 Principios Core

### 1. Separación de Responsabilidades

#### Entidades CRUD (Mono-entidad)
- **Regla de oro**: 1 Servicio = 1 Repositorio = 1 Modelo
- Cada servicio CRUD solo puede inyectar SU propio repositorio
- NUNCA debe inyectar otros servicios o repositorios
- Responsabilidad única: operaciones CRUD sobre una sola tabla/colección

```typescript
// ✅ CORRECTO
class UserService extends BaseService {
  constructor(private userRepository: UserRepository) {
    super(userRepository);
  }
}

// ❌ INCORRECTO - Potencial circularidad
class UserService {
  constructor(
    private userRepository: UserRepository,
    private orderService: OrderService  // ❌ NO hacer esto
  ) {}
}
```

#### Orquestadores (Multi-entidad)
- Coordinan operaciones entre múltiples entidades
- Inyectan N servicios, 0 repositorios
- Implementan lógica de negocio compleja
- Manejan transacciones distribuidas

```typescript
// ✅ CORRECTO
class OrderOrchestrator {
  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private paymentService: PaymentService
  ) {}
}
```

### 2. Jerarquía Estricta de Capas

```
┌─────────────────────┐
│    Controllers      │ → Validación I/O (Zod), manejo HTTP
├─────────────────────┤
│   Orquestadores     │ → Lógica de negocio compleja
├─────────────────────┤
│   Servicios CRUD    │ → Lógica de negocio mono-entidad
├─────────────────────┤
│   Repositorios      │ → Acceso a datos
├─────────────────────┤
│     Modelos         │ → Definición de esquemas
└─────────────────────┘
```

**Flujo unidireccional**: Cada capa solo conoce la inmediatamente inferior.

### 3. Prevención de Dependencias Circulares

#### ❌ Antipatrones a evitar:
- Servicios que se llaman entre sí
- Repositorios que conocen servicios
- Modelos que tienen lógica de negocio

#### ✅ Patrones correctos:
- Orquestadores coordinan servicios independientes
- Servicios solo conocen su repositorio
- Repositorios solo conocen su modelo

## 📁 Estructura de Módulos

### Módulos de Entidad (CRUD puro)
```
src/[core|api|packages]/entities/[Entity]/
├── [Entity]Routes.ts      → Rutas HTTP
├── [Entity]Controller.ts   → Hereda de BaseController
├── [Entity]Service.ts      → Hereda de BaseService
├── [Entity]Repository.ts   → Hereda de BaseRepository
├── [Entity]Model.ts        → Schema Mongoose
└── [Entity]Schema.ts       → Validaciones Zod (DTOs)
```

### Módulos Orquestadores
```
src/[core|api|packages]/orchestrators/[Capability]/
├── [Capability]Routes.ts      → Rutas de la capacidad
├── [Capability]Controller.ts   → Validación y delegación
└── [Capability]Service.ts      → Orquestación de servicios
```

## 🔧 Reglas de Implementación

### Para Servicios CRUD:
1. Heredar de `BaseService<TDocument, TResponse, TCreateDTO, TUpdateDTO>`
2. Solo inyectar el repositorio propio en el constructor
3. Sobrescribir métodos solo si hay lógica específica de la entidad
4. No hacer llamadas a otros servicios

### Para Orquestadores:
1. Inyectar servicios necesarios en el constructor
2. Implementar métodos que representen capacidades de negocio
3. Manejar transacciones cuando involucren múltiples escrituras
4. Nombrar según la capacidad: `InventoryOrchestrator`, `BillingOrchestrator`

### Para Repositorios:
1. Heredar de `BaseRepository<TDocument>`
2. Solo pasar el modelo en el constructor: `super(EntityModel)`
3. Definir filtros permanentes en el constructor si es necesario
4. Exponer métodos específicos que necesiten los orquestadores
5. Ejemplos: `getStock()`, `decrementStock()`, `findByUserId()`
6. No incluir lógica de negocio, solo acceso a datos

## 🔄 Manejo de Transacciones

Cuando una operación involucra múltiples escrituras:

```typescript
// Controller inicia la transacción
async processOrder(req: Request, res: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await this.orderOrchestrator.processOrder(
      orderData,
      { session }  // Pasa la sesión
    );
    
    await session.commitTransaction();
    res.json(result);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

## 🏗️ Patrón de Herencia Base

### BaseController
- Implementa `IController`
- Proporciona métodos CRUD estándar
- Maneja paginación, filtros, búsqueda
- Requiere implementar `buildQuery()`

### BaseService
- Implementa `IService<TResponse, TCreateDTO, TUpdateDTO>`
- Proporciona operaciones CRUD genéricas
- Maneja soft delete y restore
- Permite sobrescribir métodos específicos

### BaseRepository
- Extiende `BaseRepository<TDocument>`
- Implementa automáticamente `IRepository<T>`
- Proporciona operaciones CRUD MongoDB comunes
- Maneja filtros permanentes, paginación y filtros avanzados
- Permite definir métodos específicos del repositorio

## ✅ Checklist de Validación

Antes de crear un nuevo módulo, verificar:

- [ ] **Entidades CRUD**: ¿El servicio solo usa su propio repositorio?
- [ ] **Orquestadores**: ¿Solo inyecta servicios, no repositorios?
- [ ] **Dependencias**: ¿No hay referencias circulares?
- [ ] **Validación**: ¿Zod en controllers, lógica en services?
- [ ] **Transacciones**: ¿Se manejan correctamente las escrituras múltiples?
- [ ] **Naming**: ¿Los nombres reflejan claramente la responsabilidad?
- [ ] **Herencia**: ¿Se extienden las clases base apropiadas?

## 🚫 Reglas Inquebrantables

1. **NUNCA** un servicio CRUD debe conocer otro servicio
2. **NUNCA** un repositorio debe importar un servicio
3. **NUNCA** acceder directamente a repositorios desde orquestadores
4. **SIEMPRE** usar servicios desde orquestadores
5. **SIEMPRE** mantener el flujo unidireccional de dependencias

## 📝 Ejemplos Prácticos

### Ejemplo: Crear un pedido con inventario

```typescript
// ❌ INCORRECTO - OrderService no debe conocer InventoryService
class OrderService {
  async createOrder(data) {
    const order = await this.orderRepository.create(data);
    await this.inventoryService.decrementStock(data.items); // ❌
    return order;
  }
}

// ✅ CORRECTO - Orquestador coordina ambos servicios
class OrderOrchestrator {
  async createOrder(data) {
    // Validar stock disponible
    const stockAvailable = await this.inventoryService.checkStock(data.items);
    if (!stockAvailable) throw new Error('Stock insuficiente');
    
    // Crear orden
    const order = await this.orderService.create(data);
    
    // Actualizar inventario
    await this.inventoryService.decrementStock(data.items);
    
    return order;
  }
}
```

## 🔮 Beneficios de esta Arquitectura

1. **Testabilidad**: Cada capa se puede testear independientemente
2. **Mantenibilidad**: Responsabilidades claras y localizadas
3. **Escalabilidad**: Fácil añadir nuevos orquestadores sin tocar entidades
4. **Reutilización**: Servicios CRUD pueden ser usados por múltiples orquestadores
5. **Sin circularidades**: Flujo de dependencias unidireccional garantizado