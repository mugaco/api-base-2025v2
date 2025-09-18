/**
 * Interfaces para el Servicio de Almacenamiento
 */

/**
 * Tipos de proveedores de almacenamiento soportados
 */
export type StorageProviderType = 'minio' | 'local';

/**
 * Configuración para el StorageService
 */
export interface StorageConfig {
  provider: StorageProviderType;
  minio?: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  local?: {
    basePath: string;
    publicUrl: string;
  };
}

/**
 * Interfaz para el servicio de almacenamiento
 */
export interface IStorageService {
  registerTransport(name: string, transport: StorageTransport): void;
  setActiveTransport(name: string): boolean;
  getActiveTransport(): string | null;
  uploadFile(fileData: Buffer, options: UploadOptions): Promise<FileResult>;
  storeFile(file: Express.Multer.File, options?: Partial<UploadOptions>): Promise<FileResult>;
  storeFiles(files: Express.Multer.File[], options?: Partial<UploadOptions>): Promise<FileResult[]>;
  getFileUrl(fileId: string, options?: URLOptions): Promise<string>;
  deleteFile(fileId: string): Promise<boolean>;
  verifyConnection(): Promise<boolean>;
}

/**
 * Opciones para la subida de archivos
 */
export interface UploadOptions {
  // Nombre del archivo que se usará para almacenar (opcional, si no se proporciona se genera)
  filename?: string;
  
  // Ruta o carpeta dentro del bucket/almacenamiento
  path?: string;
  
  // Tipo de contenido (MIME type)
  contentType?: string;
  
  // Metadatos adicionales para el archivo
  metadata?: Record<string, string>;
  
  // Si el archivo debe ser accesible públicamente
  isPublic?: boolean;
  
  // Bucket personalizado (en caso de no usar el predeterminado)
  bucket?: string;
}

/**
 * Opciones para generar URLs de archivos
 */
export interface URLOptions {
  // Tiempo de expiración para URLs firmadas (en segundos)
  expiresIn?: number;
  
  // Si la URL debe ser pública independientemente de la configuración del archivo
  forcePublic?: boolean;
}

/**
 * Resultado de una operación de subida de archivo
 */
export interface FileResult {
  // ID único del archivo en el sistema de almacenamiento
  fileId: string;
  
  // Nombre original del archivo
  originalName: string;
  
  // Nombre del archivo en el sistema de almacenamiento
  storedName: string;
  
  // Ruta completa del archivo en el sistema de almacenamiento
  path: string;
  
  // URL para acceder al archivo
  url?: string;
  
  // Tipo de contenido (MIME type)
  contentType: string;
  
  // Tamaño del archivo en bytes
  size: number;
  
  // Fecha de subida
  uploadDate: Date;
  
  // Proveedor de almacenamiento utilizado
  provider: string;
  
  // Metadatos adicionales del archivo
  metadata?: Record<string, string>;
  
  // Bucket donde se almacenó el archivo
  bucket: string;
  
  // Si el archivo es accesible públicamente
  isPublic: boolean;
}

/**
 * Configuración de transporte de almacenamiento
 */
export interface ConfiguredTransport {
  name: string;
  transport: StorageTransport;
}

/**
 * Factory para crear transportes configurados
 */
export interface TransportFactory {
  createTransport(config: StorageConfig): ConfiguredTransport;
}

/**
 * Interfaz para transportes de almacenamiento
 */
export interface StorageTransport {
  /**
   * Sube un archivo al sistema de almacenamiento
   * @param fileData Datos del archivo como Buffer o Stream
   * @param options Opciones de subida
   * @returns Resultado de la operación con metadatos
   */
  upload(fileData: Buffer, options: UploadOptions): Promise<FileResult>;
  
  /**
   * Obtiene la URL para acceder a un archivo
   * @param fileId ID del archivo o ruta completa
   * @param options Opciones para generar la URL
   * @returns URL para acceder al archivo
   */
  getFileUrl(fileId: string, options?: URLOptions): Promise<string>;
  
  /**
   * Elimina un archivo del sistema de almacenamiento
   * @param fileId ID del archivo o ruta completa
   * @returns true si se eliminó correctamente
   */
  delete(fileId: string): Promise<boolean>;
  
  /**
   * Verifica que la configuración del transporte es correcta
   * @returns true si la configuración es válida
   */
  verify(): Promise<boolean>;
} 