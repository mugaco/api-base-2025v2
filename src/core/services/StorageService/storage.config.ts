/**
 * Configuración del Servicio de Almacenamiento
 */
import * as dotenv from 'dotenv';
import { ConfiguredTransport, StorageProviderType } from './storage.interfaces';
import { MinioTransport } from './transports/minio.transport';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

// Cargar variables de entorno
dotenv.config();

/**
 * Obtiene el tipo de proveedor configurado en las variables de entorno
 */
function getStorageProviderType(): StorageProviderType {
  const providerType = process.env.STORAGE_PROVIDER;
  return (providerType || 'minio') as StorageProviderType;
}

/**
 * Obtiene el transporte de almacenamiento configurado según las variables de entorno
 */
export function getConfiguredTransport(): ConfiguredTransport {
  const logger = Container.resolve<ILoggerService>('loggerService');
  const providerType = getStorageProviderType();

  logger.info(`Configurando transporte de almacenamiento: ${providerType}`);

  switch (providerType) {
    case 'minio': {
      // Configuración para MinIO
      const endpoint = process.env.MINIO_ENDPOINT || 'play.min.io';
      const port = parseInt(process.env.MINIO_PORT || '9000', 10);
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
      const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
      const bucket = process.env.MINIO_BUCKET || 'mediafiles';

      logger.info('Configuración de MinIO Transport', {
        endpoint,
        port,
        useSSL,
        bucket,
        accessKey: accessKey ? '*****' : 'no configurado',
        secretKey: secretKey ? '*****' : 'no configurado'
      });

      return {
        name: 'minio',
        transport: new MinioTransport({
          endpoint,
          port,
          useSSL,
          accessKey,
          secretKey,
          bucket
        })
      };
    }

    // Más casos para otros proveedores en el futuro

    default: {
      // En caso de un proveedor no reconocido, usar MinIO como fallback
      logger.warn(`Proveedor de almacenamiento no reconocido: ${providerType}. Usando MinIO como fallback.`);
      return getConfiguredTransport();
    }
  }
} 