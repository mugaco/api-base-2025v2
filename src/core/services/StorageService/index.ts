/**
 * Exportaciones del Servicio de Almacenamiento
 */

// Exportar interfaces y tipos
export * from './storage.interfaces';

// Exportar servicio principal
export { StorageService } from './storage.service';

// Exportar factory y configuración
export { StorageTransportFactory, createStorageConfigFromEnv } from './storage.factory';

// Exportar transportes
export { MinioTransport } from './transports/minio.transport';

// Configuración legacy (deprecated - usar factory)
export { getConfiguredTransport } from './storage.config'; 