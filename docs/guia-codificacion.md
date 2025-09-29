# Guía de codificación: Reglas fundamentales de arquitectura

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
5. **No emitir eventos**: Los servicios CRUD deben mantenerse puros y enfocados en operaciones de datos

### Para Orquestadores:
1. Inyectar servicios necesarios en el constructor
2. Implementar métodos que representen capacidades de negocio
3. Manejar transacciones cuando involucren múltiples escrituras
4. Nombrar según la capacidad: `InventoryOrchestrator`, `BillingOrchestrator`
5. **Emitir eventos**: Los orquestadores son el lugar correcto para emitir eventos

### Para Repositorios:
1. Heredar de `BaseRepository<TDocument>`
2. Solo pasar el modelo en el constructor: `super(EntityModel)`
3. Definir filtros permanentes en el constructor si es necesario
4. Exponer métodos específicos que necesiten los servicios
5. Ejemplos: `getStock()`, `decrementStock()`, `findByUserId()`
6. No incluir lógica de negocio, solo acceso a datos

## 🔄 Manejo de Transacciones

**REGLA FUNDAMENTAL**: Solo los orquestadores manejan transacciones MongoDB.

### Responsabilidades por Capa:

- **Controllers**: Solo validan y delegan al orquestador
- **Orquestadores**: Inician, manejan y finalizan transacciones usando `BaseOrchestrator.withTransaction()`
- **Servicios CRUD**: Reciben session opcional pero nunca inician transacciones
- **Repositorios**: Ejecutan operaciones con la session recibida

### Implementación con BaseOrchestrator:

```typescript
// ✅ CORRECTO - Orquestador maneja la transacción
class OrderOrchestrator extends BaseOrchestrator {
  async processComplexOrder(data: OrderData): Promise<Order> {
    return this.withTransaction(async (session) => {
      // 1. Crear orden
      const order = await this.orderService.create(data, { session });

      // 2. Actualizar inventario
      await this.inventoryService.decrementStock(data.items, { session });

      // 3. Procesar pago
      await this.paymentService.charge(data.payment, { session });

      // 4. Emitir evento tras éxito
      await this.eventService.emit('ORDER_PROCESSED', { orderId: order.id });

      return order;
    });
  }
}

// ✅ CORRECTO - Controller simplificado
class OrderController extends BaseController {
  async processOrder(req: Request, res: Response) {
    const result = await this.orderOrchestrator.processComplexOrder(req.body);
    res.json(result);
  }
}
```

### Beneficios de este Patrón:

1. **Consistencia**: Todas las transacciones usan el mismo patrón
2. **Reutilización**: El método del orquestador funciona desde cualquier contexto (HTTP, CLI, jobs)
3. **Mantenibilidad**: Lógica de transacciones centralizada en BaseOrchestrator
4. **Testabilidad**: Fácil mockear transacciones en tests unitarios

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
- Soporta transacciones a través del parámetro session opcional

### BaseOrchestrator
- Clase base para orquestadores
- Proporciona método `withTransaction()` para manejo de transacciones MongoDB
- Garantiza consistencia en el manejo de transacciones

## ✅ Checklist de Validación

Antes de crear un nuevo módulo, verificar:

- [ ] **Entidades CRUD**: ¿El servicio solo usa su propio repositorio?
- [ ] **Orquestadores**: ¿Solo inyecta servicios, no repositorios?
- [ ] **Dependencias**: ¿No hay referencias circulares?
- [ ] **Validación**: ¿Zod en controllers, lógica en services?
- [ ] **Transacciones**: ¿Los orquestadores usan BaseOrchestrator.withTransaction() para escrituras múltiples?
- [ ] **Naming**: ¿Los nombres reflejan claramente la responsabilidad?
- [ ] **Herencia**: ¿Se extienden las clases base apropiadas?

## 🚫 Reglas Inquebrantables

1. **NUNCA** un servicio CRUD debe conocer otro servicio
2. **NUNCA** un repositorio debe importar un servicio
3. **NUNCA** acceder directamente a repositorios desde orquestadores
4. **NUNCA** emitir eventos desde servicios CRUD (solo desde orquestadores)
5. **NUNCA** manejar transacciones desde controllers o servicios CRUD
6. **SIEMPRE** usar servicios desde orquestadores
7. **SIEMPRE** usar BaseOrchestrator.withTransaction() para operaciones transaccionales
8. **SIEMPRE** mantener el flujo unidireccional de dependencias
9. **SIEMPRE** emitir eventos desde orquestadores, no desde servicios

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

// ✅ CORRECTO - Orquestador coordina ambos servicios con transacción
class OrderOrchestrator extends BaseOrchestrator {
  async createOrder(data) {
    return this.withTransaction(async (session) => {
      // Validar stock disponible
      const stockAvailable = await this.inventoryService.checkStock(data.items);
      if (!stockAvailable) throw new Error('Stock insuficiente');

      // Crear orden
      const order = await this.orderService.create(data, { session });

      // Actualizar inventario
      await this.inventoryService.decrementStock(data.items, { session });

      // Emitir evento tras éxito
      await this.eventService.emit('ORDER_CREATED', { orderId: order.id });

      return order;
    });
  }
}
```

### Ejemplo: Emisión de eventos

```typescript
// ❌ INCORRECTO - Servicio CRUD emitiendo eventos
class UserService extends BaseService {
  async create(data: CreateUserDTO) {
    const user = await super.create(data);
    this.eventService.emit('USER_CREATED', user); // ❌ Viola principio de responsabilidad única
    return user;
  }
}

// ✅ CORRECTO - Orquestador emite eventos tras coordinar operaciones
class AuthOrchestrator {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private eventService: IEventService // ✅ Los orquestadores pueden inyectar EventService
  ) {}

  async registerUser(data: RegisterUserDTO) {
    // 1. Crear usuario (servicio CRUD puro)
    const user = await this.userService.create(data);

    // 2. Emitir evento desde el orquestador
    await this.eventService.emit('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    // 3. Los listeners pueden manejar tareas asíncronas como:
    //    - Envío de email de bienvenida
    //    - Actualización de analytics
    //    - Notificaciones push

    return user;
  }
}
```

## 🔮 Beneficios de esta Arquitectura

1. **Testabilidad**: Cada capa se puede testear independientemente
2. **Mantenibilidad**: Responsabilidades claras y localizadas
3. **Escalabilidad**: Fácil añadir nuevos orquestadores sin tocar entidades
4. **Reutilización**: Servicios CRUD pueden ser usados por múltiples orquestadores
5. **Sin circularidades**: Flujo de dependencias unidireccional garantizado