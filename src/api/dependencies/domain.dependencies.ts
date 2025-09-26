/**
 * Registro de dependencias de entidades del dominio
 * Incluye repositories, services y controllers de cada entidad
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

// Importar entidades - Prueba
import { PruebaRepository } from '@api/domain/entities/Prueba/PruebaRepository';
import { PruebaService } from '@api/domain/entities/Prueba/PruebaService';
import { PruebaController } from '@api/domain/entities/Prueba/PruebaController';

// Importar entidades - Test
import { TestRepository } from '@api/domain/entities/Test/TestRepository';
import { TestService } from '@api/domain/entities/Test/TestService';
import { TestController } from '@api/domain/entities/Test/TestController';

// Importar orquestadores
import { PruebaTestService } from '@api/domain/orchestrators/PruebaTestService';
import { PruebaTestController } from '@api/domain/orchestrators/PruebaTestController';

/**
 * Registra todas las dependencias relacionadas con entidades del dominio
 * Organizado por entidad para facilitar mantenimiento
 */
export function registerEntitiesDependencies(_container: AwilixContainer): void {

  // ========================================
  // Entidad: Prueba
  // ========================================
  Container.register('pruebaRepository').asClass(PruebaRepository).scoped();
  Container.register('pruebaService').asClass(PruebaService).scoped();
  Container.register('pruebaController').asClass(PruebaController).scoped();

  // ========================================
  // Entidad: Test
  // ========================================
  Container.register('testRepository').asClass(TestRepository).scoped();
  Container.register('testService').asClass(TestService).scoped();
  Container.register('testController').asClass(TestController).scoped();

  // ========================================
  // Orquestadores
  // ========================================
  Container.register('pruebaTestService').asClass(PruebaTestService).scoped();
  Container.register('pruebaTestController').asClass(PruebaTestController).scoped();

  // ========================================
  // Entidad: User (ejemplo para futura implementación)
  // ========================================
  // Container.register('userRepository').asClass(UserRepository).singleton();
  // Container.register('userService').asClass(UserService).scoped();
  // Container.register('userController').asClass(UserController).scoped();

  // ========================================
  // Entidad: Product (ejemplo para futura implementación)
  // ========================================
  // Container.register('productRepository').asClass(ProductRepository).singleton();
  // Container.register('productService').asClass(ProductService).scoped();
  // Container.register('productController').asClass(ProductController).scoped();

  // Agregar más entidades siguiendo el mismo patrón...
}