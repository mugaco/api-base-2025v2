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

// Importar orchestrator - Order
import { OrderOrchestrator } from '@api/domain/orchestrators/Order/OrderOrchestrator';
import { OrderController } from '@api/domain/orchestrators/Order/OrderController';
// Importar orquestadores
// Importar entidades - Producto
import { ProductRepository } from '@api/domain/entities/ProductPrueba/ProductRepository';
import { ProductService } from '@api/domain/entities/ProductPrueba/ProductService';
import { ProductController } from '@api/domain/entities/ProductPrueba/ProductController';

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
  // Orquestadores
  // ========================================


  // ========================================
  // Entidad: User (ejemplo para futura implementación)
  // ========================================
  // Container.register('userRepository').asClass(UserRepository).singleton();
  // Container.register('userService').asClass(UserService).scoped();
  // Container.register('userController').asClass(UserController).scoped();

  // ========================================
  // Entidad: Product PRUEBA 
  // ========================================
   Container.register('productRepository').asClass(ProductRepository).singleton();
   Container.register('productService').asClass(ProductService).scoped();
   Container.register('productController').asClass(ProductController).scoped();


  // ========================================
  // Orchestrator: Order
  // ========================================
  Container.register('orderOrchestrator').asClass(OrderOrchestrator).scoped();
  Container.register('orderController').asClass(OrderController).scoped();





  // Agregar más entidades siguiendo el mismo patrón...
}