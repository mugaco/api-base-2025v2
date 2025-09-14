/**
 * Registro de dependencias de dominio
 * Incluye entidades, servicios de dominio y orquestadores
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

// User domain
import { UserRepository } from '@core/domain/entities/User/UserRepository';
import { UserService } from '@core/domain/entities/User/UserService';
import { UserController } from '@core/domain/entities/User/UserController';

// Access domain
import { AccessRepository } from '@core/domain/entities/Access/AccessRepository';
import { AccessService } from '@core/domain/entities/Access/AccessService';
import { AccessController } from '@core/domain/entities/Access/AccessController';

// Auth orchestrator
import { AuthOrchestrator } from '@core/domain/orchestrators/Auth/AuthOrchestrator';
import { AuthController } from '@core/domain/orchestrators/Auth/AuthController';

/**
 * Registra todas las dependencias relacionadas con el dominio
 */
export function registerDomainDependencies(_container: AwilixContainer): void {

  // ========================================
  // User Domain
  // ========================================
  Container.register('userRepository').asClass(UserRepository).scoped();
  Container.register('userService').asClass(UserService).scoped();
  Container.register('userController').asClass(UserController).scoped();

  // ========================================
  // Access Domain
  // ========================================
  Container.register('accessRepository').asClass(AccessRepository).scoped();
  Container.register('accessService').asClass(AccessService).scoped();
  Container.register('accessController').asClass(AccessController).scoped();

  // ========================================
  // Auth Orchestrator
  // ========================================
  Container.register('authOrchestrator').asClass(AuthOrchestrator).scoped();
  Container.register('authController').asClass(AuthController).scoped();
}