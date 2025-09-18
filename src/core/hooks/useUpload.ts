/**
 * Hook para facilitar el uso del servicio de subida de archivos
 */
import { Container } from '@core/Container';
import { UploadOptions, UploadedFileInfo, MultiUploadResult, UploadServiceInterface } from '@core/services/UploadService';

/**
 * Tipo de retorno del hook useUpload
 */
interface UseUploadReturn {
    uploadSingleFile: (file: Express.Multer.File, options: UploadOptions) => Promise<UploadedFileInfo>;
    uploadMultipleFiles: (files: Express.Multer.File[], options: UploadOptions) => Promise<MultiUploadResult>;
    uploadSingleImage: (file: Express.Multer.File, options: UploadOptions) => Promise<UploadedFileInfo>;
    uploadMultipleImages: (files: Express.Multer.File[], options: UploadOptions) => Promise<MultiUploadResult>;
}

/**
 * Hook para acceder al servicio de subida de forma sencilla
 */
export const useUpload = (): UseUploadReturn => {
    // Obtener el servicio desde el contenedor
    const uploadService = Container.resolve<UploadServiceInterface>('uploadService');

    /**
     * Subida de un archivo individual
     */
    const uploadSingleFile = async (file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo> => {
        return uploadService.uploadSingleFile(file, options);
    };

    /**
     * Subida de múltiples archivos
     */
    const uploadMultipleFiles = async (files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult> => {
        return uploadService.uploadMultipleFiles(files, options);
    };

    /**
     * Subida de una imagen individual con generación de thumbnails
     */
    const uploadSingleImage = async (file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo> => {
        return uploadService.uploadSingleImage(file, options);
    };

    /**
     * Subida de múltiples imágenes con generación de thumbnails
     */
    const uploadMultipleImages = async (files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult> => {
        return uploadService.uploadMultipleImages(files, options);
    };

    return {
        uploadSingleFile,
        uploadMultipleFiles,
        uploadSingleImage,
        uploadMultipleImages
    };
}; 