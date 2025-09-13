/**
 * Registro de dependencias core del sistema
 * Incluye servicios fundamentales como logging, configuración, etc.
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';
import { LoggerService } from '@core/services/LoggerService';

export function registerCoreDependencies(_container: AwilixContainer): void {
  // Configuraciones básicas
  Container.register('config').asValue({
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    apiPrefix: process.env.API_PREFIX || '/api',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/api-base-2025',
  });

  // Servicios core del sistema
  Container.register('loggerService').asClass(LoggerService).singleton();

  // Aquí se pueden agregar más servicios core como:
  // - CacheService
  // - MetricsService
  // - HealthCheckService
  // - ConfigService (más elaborado)
  // - EventBus
}