/**
 * Interfaz para el servicio de subida de archivos
 */
import { Express } from 'express';
import { FileResult } from '@core/services/StorageService/storage.interfaces';

export interface UploadOptions {
    libraryId: string;
    userId?: string;
    folderId?: string;
    tags?: string;
    metadata?: Record<string, unknown>;
    isPublic?: boolean;
}

export interface UploadedFileInfo {
    originalname: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    type: string;
    libraryId: string;
    userId?: string;
    folderId?: string;
    tags?: string;
    isPublic?: boolean;
    storage: FileResult;
    thumbnails?: Array<{
        variant: string;
        width: number;
        height: number;
        format: string;
        size: number;
        path: string;
    }>;
}

/**
 * Resultado de operaciones de subida múltiple de archivos
 */
export interface MultiUploadResult {
    successful: UploadedFileInfo[];
    failed: Array<{
        file: { name: string, size: number };
        error: { message: string; code: string };
    }>;
}

export interface UploadServiceInterface {
    /**
     * Sube un único archivo al almacenamiento
     */
    uploadSingleFile(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo>;

    /**
     * Sube múltiples archivos al almacenamiento
     */
    uploadMultipleFiles(files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult>;

    /**
     * Sube una única imagen, procesándola y generando thumbnails
     */
    uploadSingleImage(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo>;

    /**
     * Sube múltiples imágenes, procesándolas y generando thumbnails
     */
    uploadMultipleImages(files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult>;
} 