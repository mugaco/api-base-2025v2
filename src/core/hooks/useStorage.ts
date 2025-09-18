/**
 * Hook para facilitar el uso del servicio de almacenamiento
 */
import { Container } from '@core/Container';
import { FileResult, UploadOptions } from '@core/services/StorageService';
import { IStorageService } from '@core/services/StorageService';
import { ILoggerService } from '@core/services/LoggerService';
import { useBadRequestError } from './useError';

/**
 * Opciones para almacenar un archivo
 */
interface StoreOptions extends Partial<UploadOptions> {
  folderId?: string;
  makePublic?: boolean;
}

/**
 * Tipo de retorno del hook useStorage
 */
interface UseStorageReturn {
  storeFile: (file: Express.Multer.File, options?: StoreOptions) => Promise<FileResult>;
  storeFiles: (files: Express.Multer.File[], options?: StoreOptions) => Promise<FileResult[]>;
  getFileUrl: (fileId: string, expiresIn?: number, forcePublic?: boolean) => Promise<string>;
  deleteFile: (fileId: string) => Promise<boolean>;
  verifyConnection: () => Promise<boolean>;
  getActiveProvider: () => string | null;
}

/**
 * Hook para utilizar el servicio de almacenamiento
 */
export const useStorage = (): UseStorageReturn => {
  const storageService = Container.resolve<IStorageService>('storageService');
  const logger = Container.resolve<ILoggerService>('loggerService');

  /**
   * Almacena un archivo y devuelve el resultado
   * @param file Archivo para almacenar (Express.Multer.File)
   * @param options Opciones de almacenamiento
   */
  const storeFile = async (file: Express.Multer.File, options: StoreOptions = {}): Promise<FileResult> => {
    try {
      if (!file || !file.buffer) {
        throw useBadRequestError('No se ha proporcionado un archivo válido');
      }

      return await storageService.storeFile(file, {
        path: options.folderId || options.path,
        isPublic: options.makePublic || options.isPublic,
        metadata: options.metadata,
        bucket: options.bucket,
        contentType: options.contentType,
        filename: options.filename
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al almacenar archivo', { error });
      throw useBadRequestError(`Error al almacenar archivo: ${errorMessage}`);
    }
  };

  /**
   * Almacena múltiples archivos y devuelve el resultado
   * @param files Array de archivos para almacenar (Express.Multer.File[])
   * @param options Opciones de almacenamiento
   */
  const storeFiles = async (files: Express.Multer.File[], options: StoreOptions = {}): Promise<FileResult[]> => {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        throw useBadRequestError('No se han proporcionado archivos válidos');
      }

      return await storageService.storeFiles(files, {
        path: options.folderId || options.path,
        isPublic: options.makePublic || options.isPublic,
        metadata: options.metadata,
        bucket: options.bucket
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al almacenar archivos', { error });
      throw useBadRequestError(`Error al almacenar archivos: ${errorMessage}`);
    }
  };

  /**
   * Obtiene la URL de un archivo
   * @param fileId ID o ruta del archivo
   * @param expiresIn Tiempo de expiración para URLs firmadas en segundos (por defecto 1 hora)
   * @param forcePublic Si la URL debe ser pública independientemente de la configuración del archivo
   */
  const getFileUrl = async (
    fileId: string, 
    expiresIn: number = 3600, 
    forcePublic: boolean = false
  ): Promise<string> => {
    try {
      if (!fileId) {
        throw useBadRequestError('No se ha proporcionado un ID de archivo válido');
      }

      return await storageService.getFileUrl(fileId, { expiresIn, forcePublic });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al obtener URL del archivo', { error, fileId });
      throw useBadRequestError(`Error al obtener URL del archivo: ${errorMessage}`);
    }
  };

  /**
   * Elimina un archivo
   * @param fileId ID o ruta del archivo
   */
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      if (!fileId) {
        throw useBadRequestError('No se ha proporcionado un ID de archivo válido');
      }

      return await storageService.deleteFile(fileId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al eliminar archivo', { error, fileId });
      throw useBadRequestError(`Error al eliminar archivo: ${errorMessage}`);
    }
  };

  /**
   * Verifica la conexión con el servicio de almacenamiento
   */
  const verifyConnection = async (): Promise<boolean> => {
    try {
      return await storageService.verifyConnection();
    } catch (error: unknown) {
      logger.error('Error al verificar conexión con el servicio de almacenamiento', { error });
      return false;
    }
  };

  /**
   * Obtiene el nombre del proveedor de almacenamiento activo
   */
  const getActiveProvider = (): string | null => {
    return storageService.getActiveTransport();
  };

  return {
    storeFile,
    storeFiles,
    getFileUrl,
    deleteFile,
    verifyConnection,
    getActiveProvider
  };
}; 