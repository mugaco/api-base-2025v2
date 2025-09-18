/**
 * Servicio de Almacenamiento
 */
import {
  StorageTransport,
  UploadOptions,
  FileResult,
  URLOptions,
  IStorageService,
  StorageConfig,
  TransportFactory
} from './storage.interfaces';
import { StorageTransportFactory } from './storage.factory';
import slugify from 'slugify';
import path from 'path';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Implementación del servicio de almacenamiento
 * Permite subir, acceder y eliminar archivos a través de diferentes proveedores
 */
export class StorageService implements IStorageService {
  private transports: Map<string, StorageTransport> = new Map();
  private activeTransport: string | null = null;
  private factory: TransportFactory;
  private config: StorageConfig;
  private logger: ILoggerService;
  
  /**
   * Constructor del servicio de almacenamiento
   * @param storageConfig Configuración del servicio de almacenamiento inyectada por Awilix
   * @param factory Factory para crear transportes (opcional)
   */
  constructor(
    { storageConfig }: { storageConfig: StorageConfig },
    factory?: TransportFactory
  ) {
    this.config = storageConfig;
    this.factory = factory || new StorageTransportFactory();
    this.logger = Container.resolve<ILoggerService>('loggerService');
    this.initialize();
  }
  
  /**
   * Inicializa el servicio con la configuración proporcionada
   */
  private initialize(): void {
    this.transports.clear();
    this.activeTransport = null;
    
    try {
      const defaultTransport = this.factory.createTransport(this.config);
      this.registerTransport(defaultTransport.name, defaultTransport.transport);
      this.activeTransport = defaultTransport.name;
    } catch (error) {
      this.logger.error('Error al inicializar StorageService', { error });
      throw error;
    }
  }
  
  /**
   * Registra un transporte de almacenamiento
   * @param name Nombre del transporte
   * @param transport Instancia del transporte
   */
  public registerTransport(name: string, transport: StorageTransport): void {
    this.transports.set(name, transport);
    this.logger.info(`Transporte registrado: ${name}`);
  }
  
  /**
   * Establece el transporte activo
   * @param name Nombre del transporte
   * @returns true si se estableció correctamente
   */
  public setActiveTransport(name: string): boolean {
    if (this.transports.has(name)) {
      this.activeTransport = name;
      this.logger.info(`Transporte activo establecido: ${name}`);
      return true;
    }
    this.logger.warn(`Transporte '${name}' no encontrado. No se ha cambiado el transporte activo.`);
    return false;
  }
  
  /**
   * Obtiene el transporte activo actualmente
   * @returns Nombre del transporte activo o null si no hay ninguno
   */
  public getActiveTransport(): string | null {
    return this.activeTransport;
  }
  
  /**
   * Obtiene la instancia del transporte activo
   * @returns Instancia del transporte o null si no hay ninguno
   * @throws Error si no hay un transporte activo
   */
  private getTransportInstance(): StorageTransport {
    if (!this.activeTransport) {
      throw new Error('No hay un transporte de almacenamiento activo. Verifica la configuración.');
    }
    
    const transport = this.transports.get(this.activeTransport);
    if (!transport) {
      throw new Error(`Transporte '${this.activeTransport}' no encontrado.`);
    }
    
    return transport;
  }
  
  /**
   * Sube un archivo utilizando el transporte activo
   * @param fileData Buffer con los datos del archivo
   * @param options Opciones de subida
   * @returns Resultado de la operación
   */
  public async uploadFile(fileData: Buffer, options: UploadOptions): Promise<FileResult> {
    try {
      const transport = this.getTransportInstance();
      
      // Procesar el nombre del archivo manteniendo la extensión
      const filename = options.filename as string;
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const sluged_basename = slugify(basename, { lower: true, strict: true });
      const sluged_filename = `${sluged_basename}${ext}`;
      
      const result = await transport.upload(fileData, { ...options, filename: sluged_filename });
      return result;
    } catch (error) {
      this.logger.error('Error al subir archivo', { error });
      throw error;
    }
  }
  
  /**
   * Almacena un archivo desde Express.Multer.File
   * @param file Archivo de Multer
   * @param options Opciones adicionales de subida
   * @returns Resultado de la operación
   */
  public async storeFile(file: Express.Multer.File, options: Partial<UploadOptions> = {}): Promise<FileResult> {
    try {
      return await this.uploadFile(file.buffer, {
        filename: options.filename || file.originalname,
        contentType: options.contentType || file.mimetype,
        path: options.path,
        metadata: options.metadata,
        isPublic: options.isPublic,
        bucket: options.bucket
      });
    } catch (error) {
      this.logger.error('Error al almacenar archivo', { error });
      throw error;
    }
  }
  
  /**
   * Almacena múltiples archivos desde Express.Multer.File[]
   * @param files Array de archivos de Multer
   * @param options Opciones adicionales de subida
   * @returns Array con los resultados de las operaciones
   */
  public async storeFiles(files: Express.Multer.File[], options: Partial<UploadOptions> = {}): Promise<FileResult[]> {
    try {
      const results: FileResult[] = [];
      
      for (const file of files) {
        const result = await this.storeFile(file, options);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error al almacenar múltiples archivos', { error });
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
      // console.log('fileId --->', fileId);
      // console.log('options --->', options);
      const transport = this.getTransportInstance();
      return await transport.getFileUrl(fileId, options);
    } catch (error) {
      this.logger.error('Error al obtener URL del archivo', { error });
      throw error;
    }
  }
  
  /**
   * Elimina un archivo
   * @param fileId ID o ruta del archivo
   * @returns true si se eliminó correctamente
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      const transport = this.getTransportInstance();
      return await transport.delete(fileId);
    } catch (error) {
      this.logger.error('Error al eliminar archivo', { error });
      throw error;
    }
  }
  
  /**
   * Verifica que la configuración del transporte es correcta
   * @returns true si la configuración es válida
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      const transport = this.getTransportInstance();
      return await transport.verify();
    } catch (error) {
      this.logger.error('Error al verificar conexión', { error });
      return false;
    }
  }
} 