/**
 * Transporte de almacenamiento para MinIO
 */
import * as crypto from 'crypto';
import * as path from 'path';
import { Client as MinioClient, ItemBucketMetadata } from 'minio';
import { StorageTransport, UploadOptions, FileResult, URLOptions } from '../storage.interfaces';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Configuración para el transporte de MinIO
 */
export interface MinioTransportConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
  publicBaseUrl?: string;
}

/**
 * Implementación del transporte de almacenamiento usando MinIO
 */
export class MinioTransport implements StorageTransport {
  private client: MinioClient;
  private config: MinioTransportConfig;
  private logger: ILoggerService;

  /**
   * Constructor del transporte MinIO
   * @param config Configuración para MinIO
   */
  constructor(config: MinioTransportConfig) {
    this.config = config;
    this.logger = Container.resolve<ILoggerService>('loggerService');

    // Crear cliente de Minio
    this.client = new MinioClient({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      pathStyle: true  // AÑADIR ESTA LÍNEA
    });

    this.ensureBucketExists();
  }

  /**
   * Se asegura de que el bucket exista, lo crea si es necesario
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.config.bucket);
      if (!exists) {
        this.logger.info(`Bucket ${this.config.bucket} no existe, creándolo...`);
        await this.client.makeBucket(this.config.bucket, this.config.region || 'us-east-1');
        this.logger.info(`Bucket ${this.config.bucket} creado exitosamente`);
      } else {
        this.logger.debug(`Bucket ${this.config.bucket} ya existe`);
      }
    } catch (error) {
      this.logger.error('Error al verificar/crear el bucket', { error, bucket: this.config.bucket });
    }
  }

  /**
   * Genera un nombre de archivo único para almacenamiento
   * @param originalFilename Nombre original del archivo
   * @returns Nombre de archivo único
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);

    return `${basename}-${timestamp}-${randomString}${ext}`.toLowerCase();
  }

  /**
   * Sube un archivo a MinIO
   * @param fileData Buffer con los datos del archivo
   * @param options Opciones de subida
   * @returns Resultado de la operación
   */
  public async upload(fileData: Buffer, options: UploadOptions): Promise<FileResult> {
    const originalName = options.filename || 'unnamed-file';
    const storedName = options.filename ? options.filename : this.generateUniqueFilename(originalName);
    const folderPath = options.path ? options.path.replace(/^\/|\/$/g, '') + '/' : '';
    const fullPath = `${folderPath}${storedName}`;
    const bucket = options.bucket || this.config.bucket;
    const contentType = options.contentType || 'application/octet-stream';

    try {

      this.logger.debug('Subiendo archivo a MinIO', {
        bucket,
        path: fullPath,
        contentType,
        size: fileData.length
      });

      // Configurar metadatos
      const metaData: ItemBucketMetadata = {
        'Content-Type': contentType,
        'X-Amz-Meta-Original-Name': originalName,
        ...options.metadata
      };

      // Subir archivo a MinIO
      await this.client.putObject(bucket, fullPath, fileData, fileData.length, metaData);

      // Generar URL para acceder al archivo
      // const url = await this.getFileUrl(fullPath, {
      //   forcePublic: options.isPublic,
      //   expiresIn: options.isPublic ? undefined : 24 * 60 * 60 // 1 día por defecto para URLs firmadas
      // });

      return {
        fileId: fullPath,
        originalName,
        storedName,
        path: fullPath,
        // url,
        contentType,
        size: fileData.length,
        uploadDate: new Date(),
        provider: 'minio',
        metadata: options.metadata,
        bucket,
        isPublic: !!options.isPublic
      };
    } catch (error) {
      this.logger.error('Error al subir archivo a MinIO', { error, path: fullPath, bucket });
      throw error;
    }
  }

  /**
   * Obtiene la URL para acceder a un archivo
   * @param fileId ID o ruta del archivo
   * @param options Opciones para generar la URL
   * @returns URL para acceder al archivo
   */
  public async getFileUrl(fileId: string, options?: URLOptions): Promise<string> {
    try {
      const isPublic = options?.forcePublic;

      // Si tenemos una URL base pública configurada y el archivo es público
      if (this.config.publicBaseUrl && isPublic) {
        return `${this.config.publicBaseUrl.replace(/\/$/, '')}/${fileId}`;
      }

      // En otro caso, generar URL firmada
      const expiresIn = options?.expiresIn || 24 * 60 * 60; // 1 día por defecto
      return await this.client.presignedGetObject(this.config.bucket, fileId, expiresIn);
    } catch (error) {
      this.logger.error('Error al generar URL', { error, fileId });
      throw error;
    }
  }

  /**
   * Elimina un archivo de MinIO
   * @param fileId ID o ruta del archivo
   * @returns true si se eliminó correctamente
   */
  public async delete(fileId: string): Promise<boolean> {
    try {
      this.logger.debug('Eliminando archivo de MinIO', { fileId });
      await this.client.removeObject(this.config.bucket, fileId);
      return true;
    } catch (error) {
      this.logger.error('Error al eliminar archivo de MinIO', { error, fileId });
      return false;
    }
  }

  /**
   * Verifica que la configuración del transporte es correcta
   * @returns true si la configuración es válida
   */
  public async verify(): Promise<boolean> {
    try {
      this.logger.debug('Verificando conexión con MinIO');
      const exists = await this.client.bucketExists(this.config.bucket);
      return exists;
    } catch (error) {
      this.logger.error('Error al verificar conexión con MinIO', { error });
      return false;
    }
  }
} 