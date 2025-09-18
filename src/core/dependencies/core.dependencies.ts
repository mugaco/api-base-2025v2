/**
 * Registro de dependencias core del sistema
 * Incluye servicios fundamentales como logging, configuración, etc.
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';
import { LoggerService } from '@core/services/LoggerService';
import { ImageTransformationService } from '@core/services/ImageService';
import { StorageService } from '@core/services/StorageService';
import { UploadService } from '@core/services/UploadService';

export function registerCoreDependencies(_container: AwilixContainer): void {
  // Configuraciones básicas
  Container.register('config').asValue({
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    apiPrefix: process.env.API_PREFIX || '/api',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/api-base-2025',
  });

  // Configuración para StorageService
  Container.register('storageConfig').asValue({
    provider: process.env.STORAGE_PROVIDER || 'minio',
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      bucket: process.env.MINIO_BUCKET || 'uploads'
    }
  });

  // Servicios core del sistema
  Container.register('loggerService').asClass(LoggerService).singleton();

  // Servicios de archivos y transformación
  Container.register('imageService').asClass(ImageTransformationService).singleton();
  Container.register('storageService').asClass(StorageService).singleton();

  // UploadService depende de storageService e imageService
  Container.register('uploadService').asClass(UploadService).singleton();

  // Aquí se pueden agregar más servicios core como:
  // - CacheService
  // - MetricsService
  // - HealthCheckService
  // - ConfigService (más elaborado)
  // - EventBus
}