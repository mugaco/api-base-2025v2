/**
 * Factory para crear configuraciones de transporte de almacenamiento
 */
import { StorageConfig, ConfiguredTransport, TransportFactory } from './storage.interfaces';
import { MinioTransport } from './transports/minio.transport';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Factory para crear transportes de almacenamiento
 */
export class StorageTransportFactory implements TransportFactory {
  /**
   * Crea un transporte configurado basado en la configuración proporcionada
   */
  createTransport(config: StorageConfig): ConfiguredTransport {
    const logger = Container.resolve<ILoggerService>('loggerService');
    logger.info(`Configurando transporte de almacenamiento: ${config.provider}`);

    switch (config.provider) {
      case 'minio': {
        if (!config.minio) {
          throw new Error('Configuración de MinIO no proporcionada');
        }

        const { endpoint, port, useSSL, accessKey, secretKey, bucket } = config.minio;

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
      
      case 'local':
        // TODO: Implementar LocalTransport cuando sea necesario
        throw new Error('Local storage transport not implemented yet');
      
      default:
        throw new Error(`Proveedor de almacenamiento no soportado: ${config.provider}`);
    }
  }
}

/**
 * Crea configuración de storage desde variables de entorno
 */
export function createStorageConfigFromEnv(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'minio') as 'minio' | 'local';
  
  switch (provider) {
    case 'minio':
      return {
        provider: 'minio',
        minio: {
          endpoint: process.env.MINIO_ENDPOINT || 'play.min.io',
          port: parseInt(process.env.MINIO_PORT || '9000', 10),
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'mediafiles'
        }
      };
    
    case 'local':
      return {
        provider: 'local',
        local: {
          basePath: process.env.STORAGE_LOCAL_PATH || './uploads',
          publicUrl: process.env.STORAGE_PUBLIC_URL || 'http://localhost:3000/uploads'
        }
      };
    
    default:
      throw new Error(`Proveedor de almacenamiento no soportado: ${provider}`);
  }
}