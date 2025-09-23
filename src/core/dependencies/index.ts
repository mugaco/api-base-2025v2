/**
 * Orquestador principal de registro de dependencias
 * Coordina el registro de todas las dependencias del sistema en orden correcto
 */
import { AwilixContainer } from 'awilix';
import { registerCoreDependencies } from './core.dependencies';
import { registerDomainDependencies } from './domain.dependencies';
import { registerEntitiesDependencies } from '@api/dependencies/domain.dependencies';
import { registerPackagesDependencies } from '@packages/dependencies/packages.dependencies';
import { registerMiddlewareDependencies } from './middleware.dependencies';
import { registerExternalDependencies } from './external.dependencies';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Función principal que registra todas las dependencias del sistema
 * El orden de registro es importante:
 * 1. Core (logger, config, etc.)
 * 2. External (base de datos, cache, etc.)
 * 3. Middleware (auth, validation, etc.)
 * 4. Entities (repositories, services, controllers)
 */
export function registerAllDependencies(container: AwilixContainer): void {
  // Obtener el logger si ya está disponible (puede no estarlo en la primera ejecución)
  let logger: ILoggerService | null = null;

  try {
    // 1. Registrar dependencias core (logger, config, etc.)
    registerCoreDependencies(container);

    // Ahora sí podemos obtener el logger
    logger = Container.resolve<ILoggerService>('loggerService');
    logger?.info('✓ Dependencias core registradas');

    // 2. Registrar servicios externos (base de datos, email, storage, etc.)
    registerExternalDependencies(container);
    logger?.info('✓ Dependencias externas registradas');

    // 3. Registrar middleware y servicios de seguridad
    registerMiddlewareDependencies(container);
    logger?.info('✓ Dependencias de middleware registradas');

    // 4. Registrar entidades de dominio core
    registerDomainDependencies(container);
    logger?.info('✓ Dependencias de dominio core registradas');

    // 5. Registrar entidades del API
    registerEntitiesDependencies(container);
    logger?.info('✓ Dependencias de entidades API registradas');

    // 6. Registrar packages (CMS y Media)
    registerPackagesDependencies(container);
    logger?.info('✓ Dependencias de packages registradas');

    logger?.info('✅ Todas las dependencias han sido registradas correctamente');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    if (logger) {
      logger.error('❌ Error al registrar dependencias', { error: errorMessage });
    } else {
      // eslint-disable-next-line no-console
      console.error('❌ Error al registrar dependencias:', errorMessage);
    }
    throw error;
  }
}

/**
 * Función de conveniencia para registrar dependencias específicas para tests
 * Permite sobrescribir dependencias con mocks o stubs
 */
export function registerTestDependencies(container: AwilixContainer): void {
  // Registrar solo las dependencias mínimas necesarias para tests
  registerCoreDependencies(container);

  // Aquí se pueden sobrescribir dependencias con mocks
  // Ejemplo:
  // Container.register('emailService').asValue(mockEmailService);
  // Container.register('databaseConnection').asValue(mockDatabase);
}

/**
 * Función para registrar dependencias en modo desarrollo
 * Puede incluir herramientas de desarrollo adicionales
 */
export function registerDevelopmentDependencies(container: AwilixContainer): void {
  registerAllDependencies(container);

  // Registrar herramientas adicionales de desarrollo
  // Ejemplo:
  // Container.register('debugService').asClass(DebugService).singleton();
  // Container.register('mockDataGenerator').asClass(MockDataGenerator).singleton();
}