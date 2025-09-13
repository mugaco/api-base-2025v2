# Container & Dependency Injection - Guía de Uso

## 🚀 Quick Start

### Ejemplo Básico

```typescript
// 1. Registrar un servicio
Container.register('myService').asClass(MyService).singleton();

// 2. Resolver el servicio
const myService = Container.resolve<MyService>('myService');

// 3. Usar el servicio
myService.doSomething();
```

## 📋 Tabla de Contenidos

1. [Conceptos Básicos](#conceptos-básicos)
2. [Registrando Dependencias](#registrando-dependencias)
3. [Resolviendo Dependencias](#resolviendo-dependencias)
4. [Trabajando con Scopes](#trabajando-con-scopes)
5. [Casos de Uso Comunes](#casos-de-uso-comunes)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Ejemplos Completos](#ejemplos-completos)
8. [FAQ](#faq)

## Conceptos Básicos

### ¿Qué es Dependency Injection?

Dependency Injection (DI) es un patrón donde las dependencias de una clase son "inyectadas" en lugar de ser creadas internamente.

**Sin DI:**
```typescript
class UserService {
  private logger = new Logger(); // ❌ Acoplamiento fuerte
  private db = new Database();   // ❌ Difícil de testear
}
```

**Con DI:**
```typescript
class UserService {
  constructor(
    private logger: Logger,    // ✅ Inyectado
    private db: Database       // ✅ Testeable
  ) {}
}
```

### ¿Por qué usar un Container?

El Container automatiza la creación y gestión de dependencias:

```typescript
// Sin Container - Manual y propenso a errores
const logger = new Logger();
const db = new Database(logger);
const userRepo = new UserRepository(db, logger);
const userService = new UserService(userRepo, logger);
const userController = new UserController(userService);

// Con Container - Automático
const userController = Container.resolve<UserController>('userController');
// ¡Todas las dependencias se resuelven automáticamente!
```

## Registrando Dependencias

### 1. Registrar una Clase

```typescript
// Sintaxis básica
Container.register('serviceName').asClass(ServiceClass).lifecycle();

// Ejemplos
Container.register('userService').asClass(UserService).singleton();
Container.register('emailService').asClass(EmailService).scoped();
Container.register('validator').asClass(Validator).transient();
```

### 2. Registrar una Función Factory

```typescript
// Cuando necesitas lógica de creación personalizada
Container.register('database').asFunction(() => {
  const config = Container.resolve<Config>('config');
  return new Database(config.dbUrl);
}).singleton();

// Con dependencias
Container.register('cache').asFunction((deps) => {
  return new RedisCache(deps.redisClient, {
    ttl: 3600
  });
}).singleton();
```

### 3. Registrar un Valor

```typescript
// Para constantes y configuración
Container.register('config').asValue({
  port: 3000,
  env: 'development',
  apiUrl: 'https://api.example.com'
});

// Instancias pre-creadas
const logger = winston.createLogger({ /* ... */ });
Container.register('logger').asValue(logger);
```

### 4. Inyección de Dependencias Específicas

```typescript
// Cuando necesitas control manual sobre las dependencias
Container.register('specialService')
  .asClass(SpecialService)
  .inject(() => ({
    logger: Container.resolve('customLogger'),
    config: { custom: 'value' }
  }))
  .singleton();
```

## Resolviendo Dependencias

### Resolución Básica

```typescript
// Desde el Container principal
const userService = Container.resolve<UserService>('userService');

// Con type safety
interface IUserService {
  findUser(id: string): Promise<User>;
}
const userService = Container.resolve<IUserService>('userService');
```

### Resolución en Controllers

```typescript
// src/api/entities/User/UserRoutes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Opción 1: Resolver desde el scope del request (RECOMENDADO)
router.get('/users/:id', async (req: Request, res: Response) => {
  const userService = req.scope!.resolve<UserService>('userService');
  const user = await userService.findById(req.params.id);
  res.json(user);
});

// Opción 2: Resolver el controller completo
router.get('/users', (req: Request, res: Response) => {
  const controller = req.scope!.resolve<UserController>('userController');
  controller.getAll(req, res);
});
```

### Resolución con Verificación

```typescript
// Verificar si existe antes de resolver
if (Container.get().has('optionalService')) {
  const service = Container.resolve('optionalService');
  // usar service
}

// Con try-catch
try {
  const service = Container.resolve('mayNotExist');
} catch (error) {
  console.log('Service not registered');
}
```

## Trabajando con Scopes

### ¿Qué es un Scope?

Un scope es un contenedor hijo que hereda del contenedor principal pero puede tener sus propias instancias de servicios `scoped`.

```typescript
// Container principal
Container.register('logger').asClass(Logger).singleton();      // Compartido
Container.register('transaction').asClass(Transaction).scoped(); // Por scope

// Scope 1
const scope1 = Container.createScope();
const tx1 = scope1.resolve('transaction'); // Nueva instancia

// Scope 2
const scope2 = Container.createScope();
const tx2 = scope2.resolve('transaction'); // Diferente instancia

// Pero el logger es el mismo en ambos
scope1.resolve('logger') === scope2.resolve('logger'); // true
```

### Scopes en Express (HTTP Requests)

Cada request HTTP tiene su propio scope gracias al middleware:

```typescript
// Automático con el middleware
app.use(scopeMiddleware);

// En tus rutas
router.post('/transfer', async (req, res) => {
  // Estos servicios son únicos para esta request
  const transactionService = req.scope!.resolve<TransactionService>('transactionService');
  const accountService = req.scope!.resolve<AccountService>('accountService');

  // Comparten la misma transacción de BD dentro de esta request
  await transactionService.begin();
  try {
    await accountService.debit(req.body.from, req.body.amount);
    await accountService.credit(req.body.to, req.body.amount);
    await transactionService.commit();
    res.json({ success: true });
  } catch (error) {
    await transactionService.rollback();
    throw error;
  }
});
```

### Agregando Valores al Scope

```typescript
// En un middleware personalizado
app.use((req, res, next) => {
  req.scope = Container.createScope();

  // Agregar valores específicos del request
  req.scope.register({
    currentUser: asValue(req.user),
    requestId: asValue(generateRequestId()),
    clientIp: asValue(req.ip)
  });

  next();
});

// Luego en un servicio
class AuditService {
  constructor(
    private currentUser: User,    // Inyectado del scope
    private requestId: string     // Inyectado del scope
  ) {}

  log(action: string) {
    console.log(`User ${this.currentUser.id} - Request ${this.requestId}: ${action}`);
  }
}
```

## Casos de Uso Comunes

### 1. Servicio con Repository

```typescript
// Repository
class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User> {
    return this.db.collection('users').findOne({ id });
  }
}

// Service
class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: ILoggerService
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.info(`Fetching user ${id}`);
    return this.userRepository.findById(id);
  }
}

// Registro
Container.register('userRepository').asClass(UserRepository).scoped();
Container.register('userService').asClass(UserService).scoped();
```

### 2. Servicio con Configuración

```typescript
// Service que necesita configuración
class EmailService {
  private transporter: any;

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async send(to: string, subject: string, body: string) {
    await this.transporter.sendMail({ to, subject, html: body });
  }
}

// Registro con factory
Container.register('emailService').asFunction(() => {
  const config = Container.resolve<AppConfig>('config');
  return new EmailService(config.email);
}).singleton();
```

### 3. Transacciones de Base de Datos

```typescript
// Transaction Service
class TransactionService {
  private session: ClientSession | null = null;

  async start() {
    this.session = await mongoose.startSession();
    this.session.startTransaction();
  }

  getSession() {
    if (!this.session) throw new Error('Transaction not started');
    return this.session;
  }

  async commit() {
    await this.session?.commitTransaction();
    this.session?.endSession();
  }

  async rollback() {
    await this.session?.abortTransaction();
    this.session?.endSession();
  }
}

// Repository usando transacción
class OrderRepository {
  constructor(private transactionService: TransactionService) {}

  async create(orderData: OrderInput) {
    const session = this.transactionService.getSession();
    return OrderModel.create([orderData], { session });
  }
}

// Registro como scoped para compartir en la misma request
Container.register('transactionService').asClass(TransactionService).scoped();
Container.register('orderRepository').asClass(OrderRepository).scoped();
```

### 4. Servicios con Cache

```typescript
// Cache decorator
class CachedUserService {
  constructor(
    private userService: UserService,
    private cache: CacheService
  ) {}

  async getUser(id: string): Promise<User> {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.userService.getUser(id);
    await this.cache.set(`user:${id}`, user, 3600);
    return user;
  }
}

// Registro con decorador
Container.register('userServiceBase').asClass(UserService).scoped();
Container.register('userService').asFunction((deps) => {
  return new CachedUserService(
    deps.userServiceBase,
    deps.cacheService
  );
}).scoped();
```

## Mejores Prácticas

### 1. Organización de Dependencias

```typescript
// ✅ BIEN: Organizado por dominio
// src/api/dependencies/entities.dependencies.ts
export function registerUserDependencies() {
  Container.register('userRepository').asClass(UserRepository).scoped();
  Container.register('userService').asClass(UserService).scoped();
  Container.register('userController').asClass(UserController).scoped();
}

// ❌ MAL: Todo mezclado
Container.register('userRepo').asClass(UserRepository).singleton();
Container.register('logger').asClass(Logger).transient();
Container.register('userSvc').asClass(UserService).singleton();
```

### 2. Nombrado Consistente

```typescript
// ✅ BIEN: Convención clara
Container.register('userRepository')    // Repositories: nombreRepository
Container.register('userService')       // Services: nombreService
Container.register('userController')    // Controllers: nombreController

// ❌ MAL: Inconsistente
Container.register('userRepo')
Container.register('user_service')
Container.register('UserCtrl')
```

### 3. Ciclos de Vida Apropiados

```typescript
// ✅ CORRECTO
Container.register('logger').asClass(Logger).singleton();           // Stateless
Container.register('dbConnection').asClass(Database).singleton();   // Conexión única
Container.register('transaction').asClass(Transaction).scoped();    // Por request
Container.register('emailBuilder').asClass(EmailBuilder).transient(); // Siempre nuevo

// ❌ INCORRECTO
Container.register('transaction').asClass(Transaction).singleton(); // ¡Compartida entre requests!
Container.register('logger').asClass(Logger).transient();          // Desperdicio de recursos
```

### 4. Interfaces sobre Implementaciones

```typescript
// ✅ BIEN: Usar interfaces
interface IUserService {
  findUser(id: string): Promise<User>;
  createUser(data: UserInput): Promise<User>;
}

class UserService implements IUserService {
  // implementación
}

// En el consumidor
constructor(private userService: IUserService) {}

// ❌ MAL: Acoplado a implementación
constructor(private userService: UserService) {}
```

### 5. Evitar Service Locator

```typescript
// ❌ MAL: Service Locator anti-pattern
class UserService {
  getLogger() {
    return Container.resolve('logger'); // No hacer esto
  }
}

// ✅ BIEN: Inyección en constructor
class UserService {
  constructor(private logger: ILoggerService) {} // Inyectado
}
```

## Ejemplos Completos

### Ejemplo 1: API REST Completa

```typescript
// 1. Definir interfaces
interface IUserRepository {
  findById(id: string): Promise<User>;
  create(data: UserInput): Promise<User>;
  update(id: string, data: UserUpdate): Promise<User>;
  delete(id: string): Promise<boolean>;
}

interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(data: UserInput): Promise<User>;
  updateUser(id: string, data: UserUpdate): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// 2. Implementar Repository
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User> {
    return this.db.collection('users').findOne({ _id: id });
  }

  async create(data: UserInput): Promise<User> {
    return this.db.collection('users').insertOne(data);
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    return this.db.collection('users').findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection('users').deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

// 3. Implementar Service
class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private logger: ILoggerService
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.info(`Getting user ${id}`);
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    return user;
  }

  async createUser(data: UserInput): Promise<User> {
    this.logger.info('Creating new user');
    const user = await this.userRepository.create(data);

    // Enviar email de bienvenida
    await this.emailService.sendWelcome(user.email, user.name);

    return user;
  }

  async updateUser(id: string, data: UserUpdate): Promise<User> {
    this.logger.info(`Updating user ${id}`);
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.info(`Deleting user ${id}`);
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`User ${id} not found`);
    }
  }
}

// 4. Implementar Controller
class UserController {
  constructor(private userService: IUserService) {}

  async getUser(req: Request, res: Response) {
    try {
      const user = await this.userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      await this.userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

// 5. Registrar dependencias
export function registerUserModule() {
  Container.register('userRepository').asClass(UserRepository).scoped();
  Container.register('userService').asClass(UserService).scoped();
  Container.register('userController').asClass(UserController).scoped();
}

// 6. Configurar rutas
const router = Router();

router.get('/users/:id', (req, res) => {
  const controller = req.scope!.resolve<UserController>('userController');
  controller.getUser(req, res);
});

router.post('/users', (req, res) => {
  const controller = req.scope!.resolve<UserController>('userController');
  controller.createUser(req, res);
});

router.put('/users/:id', (req, res) => {
  const controller = req.scope!.resolve<UserController>('userController');
  controller.updateUser(req, res);
});

router.delete('/users/:id', (req, res) => {
  const controller = req.scope!.resolve<UserController>('userController');
  controller.deleteUser(req, res);
});

export const userRoutes = router;
```

### Ejemplo 2: Testing con Mocks

```typescript
// test/services/UserService.test.ts
import { Container } from '@core/Container';
import { UserService } from '@api/services/UserService';

describe('UserService', () => {
  let container: AwilixContainer;

  beforeEach(() => {
    // Crear container limpio para tests
    Container.create();
    container = Container.get();

    // Registrar mocks
    const mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    const mockEmailService = {
      sendWelcome: jest.fn()
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    Container.register('userRepository').asValue(mockUserRepository);
    Container.register('emailService').asValue(mockEmailService);
    Container.register('logger').asValue(mockLogger);
    Container.register('userService').asClass(UserService).singleton();
  });

  afterEach(() => {
    Container.dispose();
  });

  test('should get user by id', async () => {
    // Arrange
    const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com' };
    const userRepository = Container.resolve('userRepository');
    userRepository.findById.mockResolvedValue(mockUser);

    const userService = Container.resolve<UserService>('userService');

    // Act
    const user = await userService.getUser('123');

    // Assert
    expect(user).toEqual(mockUser);
    expect(userRepository.findById).toHaveBeenCalledWith('123');
  });

  test('should throw NotFoundError when user not found', async () => {
    // Arrange
    const userRepository = Container.resolve('userRepository');
    userRepository.findById.mockResolvedValue(null);

    const userService = Container.resolve<UserService>('userService');

    // Act & Assert
    await expect(userService.getUser('999')).rejects.toThrow('User 999 not found');
  });

  test('should create user and send welcome email', async () => {
    // Arrange
    const userData = { name: 'Jane Doe', email: 'jane@example.com' };
    const newUser = { id: '456', ...userData };

    const userRepository = Container.resolve('userRepository');
    const emailService = Container.resolve('emailService');

    userRepository.create.mockResolvedValue(newUser);
    emailService.sendWelcome.mockResolvedValue(true);

    const userService = Container.resolve<UserService>('userService');

    // Act
    const user = await userService.createUser(userData);

    // Assert
    expect(user).toEqual(newUser);
    expect(userRepository.create).toHaveBeenCalledWith(userData);
    expect(emailService.sendWelcome).toHaveBeenCalledWith('jane@example.com', 'Jane Doe');
  });
});
```

### Ejemplo 3: Integración con MongoDB y Transacciones

```typescript
// Transaction-aware repository base
abstract class BaseRepository<T> {
  constructor(
    protected model: Model<T>,
    protected transactionService?: TransactionService
  ) {}

  protected getSession() {
    return this.transactionService?.getSession();
  }

  async create(data: Partial<T>): Promise<T> {
    const session = this.getSession();
    const [doc] = await this.model.create([data], { session });
    return doc;
  }

  async findById(id: string): Promise<T | null> {
    const session = this.getSession();
    return this.model.findById(id).session(session);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const session = this.getSession();
    return this.model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, session }
    );
  }

  async delete(id: string): Promise<boolean> {
    const session = this.getSession();
    const result = await this.model.deleteOne({ _id: id }).session(session);
    return result.deletedCount > 0;
  }
}

// Order service with transactions
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryRepository: InventoryRepository,
    private paymentService: PaymentService,
    private transactionService: TransactionService
  ) {}

  async createOrder(orderData: OrderInput): Promise<Order> {
    await this.transactionService.start();

    try {
      // 1. Verificar inventario (usa la misma transacción)
      const available = await this.inventoryRepository.checkAvailability(
        orderData.items
      );
      if (!available) {
        throw new Error('Items not available');
      }

      // 2. Crear orden (usa la misma transacción)
      const order = await this.orderRepository.create(orderData);

      // 3. Actualizar inventario (usa la misma transacción)
      await this.inventoryRepository.decrementStock(orderData.items);

      // 4. Procesar pago (servicio externo, no transaccional)
      const payment = await this.paymentService.charge(
        orderData.customerId,
        order.total
      );

      if (!payment.success) {
        throw new Error('Payment failed');
      }

      // 5. Actualizar orden con info de pago (usa la misma transacción)
      await this.orderRepository.update(order.id, {
        paymentId: payment.id,
        status: 'paid'
      });

      // Todo exitoso, commit
      await this.transactionService.commit();
      return order;

    } catch (error) {
      // Algo falló, rollback
      await this.transactionService.rollback();
      throw error;
    }
  }
}

// Registro con scope para compartir transacción
Container.register('transactionService').asClass(TransactionService).scoped();
Container.register('orderRepository').asClass(OrderRepository).scoped();
Container.register('inventoryRepository').asClass(InventoryRepository).scoped();
Container.register('orderService').asClass(OrderService).scoped();
```

## FAQ

### ¿Cuándo usar singleton vs scoped vs transient?

| Tipo | Usar cuando... | Ejemplo |
|------|---------------|---------|
| **Singleton** | El servicio no tiene estado o el estado es global | Logger, Config, DB Connection |
| **Scoped** | El servicio necesita estado por request | Transaction, User Context |
| **Transient** | Siempre necesitas una nueva instancia | Builders, Temporary objects |

### ¿Cómo manejar dependencias opcionales?

```typescript
class MyService {
  constructor(
    private requiredService: RequiredService,
    private optionalService?: OptionalService // Opcional con ?
  ) {}

  doSomething() {
    this.requiredService.execute();
    this.optionalService?.execute(); // Optional chaining
  }
}

// Registro con inject para control manual
Container.register('myService')
  .asClass(MyService)
  .inject(() => {
    const deps: any = {
      requiredService: Container.resolve('requiredService')
    };

    // Solo agregar si existe
    if (Container.get().has('optionalService')) {
      deps.optionalService = Container.resolve('optionalService');
    }

    return deps;
  })
  .singleton();
```

### ¿Cómo debuggear problemas de dependencias?

```typescript
// 1. Ver todas las dependencias registradas
console.log('Registered:', Object.keys(Container.get().registrations));

// 2. Verificar si una dependencia existe
console.log('Has userService?', Container.get().has('userService'));

// 3. Ver el cradle (todas las instancias resueltas)
const scope = Container.createScope();
console.log('Cradle:', scope.cradle);

// 4. Debugging detallado
try {
  const service = Container.resolve('problemService');
} catch (error) {
  console.error('Resolution error:', error);
  // El error mostrará la cadena de dependencias
}
```

### ¿Cómo manejar configuración por ambiente?

```typescript
// config.dependencies.ts
export function registerConfig() {
  const env = process.env.NODE_ENV || 'development';

  const configs = {
    development: {
      db: 'mongodb://localhost:27017/dev',
      cache: 'memory',
      logLevel: 'debug'
    },
    production: {
      db: process.env.DATABASE_URL,
      cache: 'redis',
      logLevel: 'info'
    },
    test: {
      db: 'mongodb://localhost:27017/test',
      cache: 'memory',
      logLevel: 'error'
    }
  };

  Container.register('config').asValue(configs[env]);

  // Servicios condicionales por ambiente
  if (env === 'production') {
    Container.register('cache').asClass(RedisCache).singleton();
  } else {
    Container.register('cache').asClass(MemoryCache).singleton();
  }
}
```

### ¿Cómo migrar código existente a DI?

```typescript
// ANTES: Sin DI
class UserService {
  private db = new Database();
  private logger = new Logger();
  private emailer = new EmailService();

  async createUser(data: UserInput) {
    this.logger.info('Creating user');
    const user = await this.db.users.create(data);
    await this.emailer.sendWelcome(user.email);
    return user;
  }
}

// PASO 1: Mover dependencias al constructor
class UserService {
  private db: Database;
  private logger: Logger;
  private emailer: EmailService;

  constructor() {
    this.db = new Database();
    this.logger = new Logger();
    this.emailer = new EmailService();
  }
}

// PASO 2: Aceptar dependencias como parámetros
class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
    private emailer: EmailService
  ) {}
}

// PASO 3: Registrar en el container
Container.register('database').asClass(Database).singleton();
Container.register('logger').asClass(Logger).singleton();
Container.register('emailService').asClass(EmailService).singleton();
Container.register('userService').asClass(UserService).scoped();

// PASO 4: Resolver desde el container
const userService = Container.resolve<UserService>('userService');
```

### ¿Cómo organizar las dependencias en un proyecto grande?

```
src/
├── core/
│   └── dependencies/
│       ├── index.ts                    # Orquestador principal
│       ├── core.dependencies.ts        # Logger, Config, etc.
│       ├── external.dependencies.ts    # DB, Cache, Email, etc.
│       └── middleware.dependencies.ts  # Auth, Validation, etc.
├── api/
│   ├── dependencies/
│   │   ├── entities.dependencies.ts    # Todas las entidades
│   │   └── modules/                    # O separado por módulos
│   │       ├── user.dependencies.ts
│   │       ├── order.dependencies.ts
│   │       └── payment.dependencies.ts
│   └── entities/
│       ├── user/
│       │   ├── UserController.ts
│       │   ├── UserService.ts
│       │   └── UserRepository.ts
│       └── order/
│           ├── OrderController.ts
│           ├── OrderService.ts
│           └── OrderRepository.ts
└── shared/
    └── interfaces/
        ├── IUserService.ts
        ├── IOrderService.ts
        └── IRepository.ts
```

### ¿Cómo evitar dependencias circulares?

```typescript
// ❌ PROBLEMA: Dependencia circular
class UserService {
  constructor(private orderService: OrderService) {}
}

class OrderService {
  constructor(private userService: UserService) {} // Circular!
}

// ✅ SOLUCIÓN 1: Extraer lógica común
class UserDataService {
  // Lógica compartida
}

class UserService {
  constructor(private userData: UserDataService) {}
}

class OrderService {
  constructor(private userData: UserDataService) {}
}

// ✅ SOLUCIÓN 2: Lazy loading con factory
Container.register('userService').asFunction((deps) => {
  const service = new UserService();
  // Configurar dependencias lazy
  service.setOrderService = () => deps.orderService;
  return service;
}).scoped();

// ✅ SOLUCIÓN 3: Event emitter
class EventBus {
  emit(event: string, data: any) { /* ... */ }
  on(event: string, handler: Function) { /* ... */ }
}

class UserService {
  constructor(private eventBus: EventBus) {
    this.eventBus.on('order.created', this.handleOrderCreated);
  }
}

class OrderService {
  constructor(private eventBus: EventBus) {}

  createOrder(data: OrderInput) {
    // ...
    this.eventBus.emit('order.created', order);
  }
}
```

## Recursos Adicionales

- [Documentación Técnica del Container](./container-di-technical.md)
- [Awilix Documentation](https://github.com/jeffijoe/awilix)
- [Dependency Injection in TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)