/**
 * Servicio para la subida de archivos
 */
import { IStorageService } from '@core/services/StorageService';
import { FileResult } from '@core/services/StorageService/storage.interfaces';
import { ImageTransformationServiceInterface } from '@core/services/ImageService';
import { useMediaValidation } from '@core/hooks/useMediaValidations';
import { useBadRequestError, HttpError } from '@core/hooks/useError';
import { UploadOptions, UploadedFileInfo, UploadServiceInterface, MultiUploadResult } from './upload.interface';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

export class UploadService implements UploadServiceInterface {
    constructor({
        storageService,
        imageService
    }: {
        storageService: IStorageService;
        imageService: ImageTransformationServiceInterface;
    }) {
        this.storageService = storageService;
        this.imageService = imageService;
    }

    private storageService: IStorageService;
    private imageService: ImageTransformationServiceInterface;

    /**
     * Sube un único archivo al almacenamiento
     */
    async uploadSingleFile(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo> {
        if (!file) {
            throw useBadRequestError('No se ha proporcionado ningún archivo');
        }

        if (!options.libraryId) {
            throw useBadRequestError('Se requiere un ID de biblioteca para subir el archivo');
        }

        // Validar el tipo de archivo
        const mediaType = useMediaValidation(file, []);

        // Guardar el archivo usando el StorageService
        const storedFile = await this.storageService.storeFile(file);

        // Devolver la información para crear el documento en la base de datos
        return {
            originalname: file.originalname,
            filename: storedFile.storedName,
            path: storedFile.path,
            size: file.size,
            mimetype: file.mimetype,
            type: mediaType,
            libraryId: options.libraryId,
            userId: options.userId,
            folderId: options.folderId,
            tags: options.tags,
            isPublic: options.isPublic !== undefined ? options.isPublic : true,
            storage: storedFile
        };
    }

    /**
     * Sube múltiples archivos al almacenamiento
     */
    async uploadMultipleFiles(files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult> {
        if (!files || files.length === 0) {
            throw useBadRequestError('No se han proporcionado archivos');
        }

        if (!options.libraryId) {
            throw useBadRequestError('Se requiere un ID de biblioteca para subir archivos');
        }

        const successful: UploadedFileInfo[] = [];
        const failed: Array<{
            file: { name: string, size: number };
            error: { message: string; code: string };
        }> = [];

        for (const file of files) {
            try {
                const result = await this.uploadSingleFile(file, options);
                successful.push(result);
            } catch (error: unknown) {
                // Determinar el tipo correcto de error
                let errorData: { message: string; code: string };

                if (error instanceof HttpError) {
                    // Error ya formateado por nuestros hooks
                    errorData = {
                        message: error.message,
                        code: error.code
                    };
                } else if ((error as { code?: number; name?: string }).code === 11000 || ((error as { name?: string }).name === 'MongoServerError' && (error as { code?: number }).code === 11000)) {
                    // Error de duplicidad de MongoDB
                    errorData = {
                        message: `Ya existe un archivo con el nombre "${file.originalname}" en esta biblioteca`,
                        code: 'FILE_ALREADY_EXISTS'
                    };
                } else {
                    // Otros errores
                    errorData = {
                        message: (error as Error).message || 'Error desconocido',
                        code: 'UPLOAD_ERROR'
                    };
                }
                
                // Capturar el error y continuar con el siguiente archivo
                failed.push({
                    file: {
                        name: file.originalname,
                        size: file.size
                    },
                    error: errorData
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Sube una única imagen, procesándola y generando thumbnails
     */
    async uploadSingleImage(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFileInfo> {
        if (!file) {
            throw useBadRequestError('No se ha proporcionado ninguna imagen');
        }

        if (!options.libraryId) {
            throw useBadRequestError('Se requiere un ID de biblioteca para subir la imagen');
        }

        // Validar como imagen específicamente
        useMediaValidation(file, ['image']);

        try {
            // Procesar como imagen usando el servicio de transformación
            const transformOptions = {
                variants: this.imageService.getDefaultVariants(),
                keepOriginal: true,
                defaultFormat: 'webp' // Formato optimizado para web
            };

            // Transformar la imagen y obtener las variantes
            const processedImages = await this.imageService.transformImage(file, transformOptions);

            // Guardar todas las variantes (incluida la original)
            const storedImages: (FileResult & { variant: string; width: number; height: number; format: string })[] = [];

            for (const img of processedImages) {
                // Adaptar la imagen procesada para el StorageService
                let originalname = img.originalname;
                if(img.variant !== 'original'){
                    originalname = `${img.variant}-${img.originalname}`;
                }
                const fileToStore: Express.Multer.File = {
                    ...file,
                    buffer: img.buffer,
                    originalname: originalname,
                    mimetype: `image/${img.format}`,
                    size: img.size
                } as Express.Multer.File;

                // Guardar usando el StorageService
                const stored = await this.storageService.storeFile(fileToStore);

                // Añadir metadatos adicionales del procesamiento
                storedImages.push({
                    ...stored,
                    variant: img.variant,
                    width: img.width,
                    height: img.height,
                    format: img.format
                });
            }

            // Encontrar la imagen original
            const originalImg = storedImages.find(img => img.variant === 'original');
            if (!originalImg) {
                throw useBadRequestError('Error al procesar la imagen original');
            }

            // Preparar thumbnails para metadata
            const thumbnails = storedImages
                .filter(img => img.variant !== 'original')
                .map(img => ({
                    variant: img.variant,
                    width: img.width,
                    height: img.height,
                    format: img.format,
                    size: img.size,
                    path: img.path
                }));

            // Devolver información completa con thumbnails
            return {
                originalname: file.originalname,
                filename: originalImg.storedName,
                path: originalImg.path,
                size: originalImg.size || file.size,
                mimetype: originalImg.contentType || file.mimetype,
                type: 'image',
                libraryId: options.libraryId,
                userId: options.userId,
                folderId: options.folderId,
                tags: options.tags,
                isPublic: options.isPublic !== undefined ? options.isPublic : true,
                thumbnails: thumbnails,
                storage: originalImg
            };
        } catch (error) {
            const logger = Container.resolve<ILoggerService>('loggerService');
            logger.error('Error al procesar la imagen', { error });

            // Si falla el procesamiento de la imagen, intentar guardarla como archivo normal
            return this.uploadSingleFile(file, options);
        }
    }

    /**
     * Sube múltiples imágenes, procesándolas y generando thumbnails
     */
    async uploadMultipleImages(files: Express.Multer.File[], options: UploadOptions): Promise<MultiUploadResult> {
        if (!files || files.length === 0) {
            throw useBadRequestError('No se han proporcionado imágenes');
        }

        if (!options.libraryId) {
            throw useBadRequestError('Se requiere un ID de biblioteca para subir imágenes');
        }

        const successful: UploadedFileInfo[] = [];
        const failed: Array<{
            file: { name: string, size: number };
            error: { message: string; code: string };
        }> = [];

        for (const file of files) {
            try {
                const result = await this.uploadSingleImage(file, options);
                successful.push(result);
            } catch (error: unknown) {
                // Determinar el tipo correcto de error
                let errorData: { message: string; code: string };

                if (error instanceof HttpError) {
                    // Error ya formateado por nuestros hooks
                    errorData = {
                        message: error.message,
                        code: error.code
                    };
                } else if ((error as { code?: number; name?: string }).code === 11000 || ((error as { name?: string }).name === 'MongoServerError' && (error as { code?: number }).code === 11000)) {
                    // Error de duplicidad de MongoDB
                    errorData = {
                        message: `Ya existe una imagen con el nombre "${file.originalname}" en esta biblioteca`,
                        code: 'FILE_ALREADY_EXISTS'
                    };
                } else {
                    // Otros errores
                    errorData = {
                        message: (error as Error).message || 'Error desconocido al procesar la imagen',
                        code: 'UPLOAD_ERROR'
                    };
                }
                
                // Capturar el error y continuar con el siguiente archivo
                failed.push({
                    file: {
                        name: file.originalname,
                        size: file.size
                    },
                    error: errorData
                });
            }
        }

        return { successful, failed };
    }
} 