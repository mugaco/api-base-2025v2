/**
 * Registro de dependencias de entidades del dominio
 * Incluye repositories, services y controllers de cada entidad
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

// Importar entidades - Prueba
import { PruebaRepository } from '@api/entities/Prueba/PruebaRepository';
import { PruebaService } from '@api/entities/Prueba/PruebaService';
import { PruebaController } from '@api/entities/Prueba/PruebaController';

// Importar entidades - Test
import { TestRepository } from '@api/entities/Test/TestRepository';
import { TestService } from '@api/entities/Test/TestService';
import { TestController } from '@api/entities/Test/TestController';

/**
 * Registra todas las dependencias relacionadas con entidades del dominio
 * Organizado por entidad para facilitar mantenimiento
 */
export function registerEntitiesDependencies(_container: AwilixContainer): void {

  // ========================================
  // Entidad: Prueba
  // ========================================
  Container.register('pruebaRepository').asClass(PruebaRepository).singleton();
  Container.register('pruebaService').asClass(PruebaService).singleton();
  Container.register('pruebaController').asClass(PruebaController).singleton();

  // ========================================
  // Entidad: Test
  // ========================================
  Container.register('testRepository').asClass(TestRepository).scoped();
  Container.register('testService').asClass(TestService).scoped();
  Container.register('testController').asClass(TestController).scoped();

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