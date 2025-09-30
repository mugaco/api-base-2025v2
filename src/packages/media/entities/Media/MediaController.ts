/**
 * Controlador para Media
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { MediaService } from './MediaService';
import { CreateMediaSchema, UpdateMediaSchema, ICreateMedia, IUpdateMedia, mediaToResponse } from './MediaSchema';
import { useBadRequestError } from '@core/hooks/useError';
import { useUpload } from '@core/hooks/useUpload';
import { IMedia } from './MediaModel';
import { useStorage } from '@core/hooks/useStorage';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';
import * as https from 'https';
import * as http from 'http';

/**
 * Interfaz extendida para el MediaService con métodos específicos
 */
interface ExtendedMediaService extends MediaService {
  getByFilenameAndLibrarySlug(slug: string, librarySlug: string): Promise<IMedia>;
  searchWithFilters(params: {
    query: Record<string, unknown>;
    paginationParams: unknown;
    options: unknown;
    searchTerm?: string;
    type?: string;
    library_slug?: string;
    folder_id?: string;
    user_id?: string;
  }): Promise<IPaginatedResponse<IMedia>>;
}

/**
 * Controlador para la entidad Media heredando de BaseController
 */
export class MediaController extends BaseController<MediaService> {
  private logger: ILoggerService;

  constructor(mediaService: MediaService) {
    super(mediaService);
    this.logger = Container.resolve<ILoggerService>('loggerService');
  }

  protected buildQuery(req: Request): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    // Añadir filtros específicos del recurso aquí
    // Por defecto, mostrar solo elementos no eliminados
    if (req.query.isDeleted === undefined) {
      query.isDeleted = false;
    } else {
      query.isDeleted = req.query.isDeleted === 'true';
    }

    return query;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar con Zod
      const parseResult = CreateMediaSchema.safeParse(req.body);

      if (!parseResult.success) {
        return this.sendErrorResponse(res, 'Error de validación', 400, parseResult.error.errors);
      }

      const data = parseResult.data as ICreateMedia;
      const newItem = await this.service.create(data);

      this.sendSuccessResponse(res, mediaToResponse(newItem as never), 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;

      // Validar con Zod
      const parseResult = UpdateMediaSchema.safeParse(req.body);

      if (!parseResult.success) {
        return this.sendErrorResponse(res, 'Error de validación', 400, parseResult.error.errors);
      }

      const data = parseResult.data as IUpdateMedia;
      const updatedItem = await this.service.update(_id, data);

      this.sendSuccessResponse(res, mediaToResponse(updatedItem as never));
    } catch (error) {
      next(error);
    }
  };

  // Override softDelete y restore para usar mediaToResponse
  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const item = await this.service.softDelete!(_id);

      this.sendSuccessResponse(res, mediaToResponse(item as never));
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const item = await this.service.restore!(_id);

      this.sendSuccessResponse(res, mediaToResponse(item as never));
    } catch (error) {
      next(error);
    }
  };

  findPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = this.buildQuery(req);
      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);

      const result = await this.service.findPaginated(query, paginationParams, options);

      // Transformar cada item a respuesta
      if (result && typeof result === 'object' && 'data' in result) {
        const paginatedResult = result as IPaginatedResponse<IMedia>;
        if (Array.isArray(paginatedResult.data)) {
          const transformedData = paginatedResult.data.map((item: IMedia) => mediaToResponse(item as never));
          (paginatedResult as IPaginatedResponse<unknown>).data = transformedData;
        }
      }

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sirve un archivo al cliente
   */
  serveFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const librarySlug = req.params.library_slug;
      const fileSlug = req.params.file_slug;

      if (!librarySlug || !fileSlug) {
        throw useBadRequestError('Se requiere el slug de la biblioteca y el nombre del archivo');
      }

      const file = await (this.service as ExtendedMediaService).getByFilenameAndLibrarySlug(fileSlug, librarySlug);
      if (!file) {
        return this.sendErrorResponse(res, 'Archivo no encontrado', 404);
      }

      // Importar el hook de almacenamiento
      const { getFileUrl } = useStorage();

      // Determinar la ruta del archivo en Minio
      // Si el archivo tiene variants y se solicita una variante específica, usar esa ruta
      let filePath = file.storage.path;

      // Si el propio fileSlug incluye un prefijo de variante (thumb_sm, thumb_md, etc.)
      // buscar la variante correspondiente
      if (file.variants && file.variants.length > 0) {
        // Verificar si el slug solicitado comienza con algún prefijo de variante
        const thumbPrefixes = ['thumbsm-', 'thumbmd-', 'thumblg-'];
        for (const prefix of thumbPrefixes) {
          if (fileSlug.startsWith(prefix)) {
            // Encontrar la variante correspondiente (thumb_sm, thumb_md, thumb_lg)
            const variantName = prefix === 'thumbsm-' ? 'thumb_sm' :
              prefix === 'thumbmd-' ? 'thumb_md' : 'thumb_lg';

            const requestedVariant = file.variants?.find((v) => (v as { variant: string; path: string }).variant === variantName);
            if (requestedVariant) {
              filePath = (requestedVariant as { variant: string; path: string }).path;
              break;
            }
          }
        }
      }

      // Generar URL firmada o pública según configuración
      const isPublic = file.storage.isPublic || false;
      // Por defecto, las URLs expirarán en 1 hora (3600 segundos)
      const expiresIn = 3600;

      // Obtener la URL del archivo
      const fileUrl = await getFileUrl(filePath, expiresIn, isPublic);

      // Redirigir al cliente a la URL generada
      res.redirect(fileUrl);
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchTerm = req.query.term as string;
      if (!searchTerm) {
        return this.sendErrorResponse(res, 'El término de búsqueda es requerido', 400);
      }

      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);

      const result = await (this.service as ExtendedMediaService & { search: (term: string, params: unknown, options: unknown) => Promise<IPaginatedResponse<IMedia>> }).search(searchTerm, paginationParams, options);

      // Transformar cada item a respuesta
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        const transformedData = result.data.map((item: IMedia) => mediaToResponse(item as never));
        (result as IPaginatedResponse<unknown>).data = transformedData;
      }

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };


  /**
   * Maneja la subida de un solo archivo
   */
  uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar si se ha subido un archivo
      if (!req.file) {
        throw useBadRequestError('No se ha subido ningún archivo');
      }

      // Extraer el ID de la biblioteca
      const libraryId = req.body.libraryId || req.query.libraryId;
      if (!libraryId) {
        throw useBadRequestError('Se requiere un ID de biblioteca para subir el archivo');
      }

      // Usar el hook de upload para procesar el archivo
      const { uploadSingleFile } = useUpload();
      const processedFile = await uploadSingleFile(req.file, {
        libraryId,
        userId: req.body.user_id,
        folderId: req.body.folder_id,
        tags: req.body.tags,
        metadata: req.body.metadata,
        isPublic: req.body.isPublic !== 'false'
      });

      try {
        // Crear el registro en la base de datos
        const mediaData: Partial<IMedia> = {
          filename: processedFile.filename,
          originalFilename: processedFile.originalname,
          type: processedFile.type as IMedia['type'],
          mimeType: processedFile.mimetype,
          size: processedFile.size,
          storage: processedFile.storage,
          library_id: processedFile.libraryId,
          library_name: req.body.library_name,
          library_slug: req.body.library_slug,
          folder_id: processedFile.folderId,
          tag_ids: processedFile.tags ? processedFile.tags.split(',') : undefined,
          user_id: processedFile.userId,
          metadata: req.body.metadata
        };

        const media = await this.service.create(mediaData as ICreateMedia);

        // Enviar respuesta
        this.sendSuccessResponse(res, mediaToResponse(media as never), 201);
      } catch (dbError: unknown) {
        // Capturar errores específicos de la base de datos
        // Si es un error de duplicidad (E11000), enviar una respuesta más amigable
        if ((dbError as { code?: string }).code === 'FILE_ALREADY_EXISTS' ||
          ((dbError as { name?: string }).name === 'MongoServerError' && (dbError as { code?: number }).code === 11000)) {
          res.status(400).json({
            status: 'error',
            code: 'FILE_ALREADY_EXISTS',
            message: `Ya existe un archivo con el nombre "${processedFile.originalname}" en esta biblioteca`
          });
          return;
        }

        // Otros errores de base de datos
        next(dbError);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Maneja la subida de múltiples archivos
   */
  uploadFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar si se han subido archivos
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw useBadRequestError('No se han subido archivos');
      }

      // Extraer el ID de la biblioteca
      const libraryId = req.body.libraryId || req.query.libraryId;
      if (!libraryId) {
        throw useBadRequestError('Se requiere un ID de biblioteca para subir archivos');
      }

      // Usar el hook de upload para procesar los archivos
      const { uploadMultipleFiles } = useUpload();
      const uploadResult = await uploadMultipleFiles(req.files, {
        libraryId,
        userId: req.body.user_id,
        folderId: req.body.folder_id,
        tags: req.body.tags,
        metadata: req.body.metadata,
        isPublic: req.body.isPublic !== 'false'
      });

      // Guardar los archivos en la base de datos
      const mediaItems = [];
      const errors = [];

      for (const processedFile of uploadResult.successful) {
        try {
          const mediaData: Partial<IMedia> = {
            filename: processedFile.filename,
            originalFilename: processedFile.originalname,
            type: processedFile.type as IMedia['type'],
            mimeType: processedFile.mimetype,
            size: processedFile.size,
            storage: processedFile.storage,
            library_id: processedFile.libraryId,
            library_name: req.body.library_name,
            library_slug: req.body.library_slug,
            folder_id: processedFile.folderId,
            tag_ids: processedFile.tags ? processedFile.tags.split(',') : undefined,
            user_id: processedFile.userId,
            metadata: req.body.metadata
          };

          const media = await this.service.create(mediaData as ICreateMedia);
          mediaItems.push(mediaToResponse(media as never));
        } catch (error: unknown) {
          // Si es un error de duplicidad, añadir a la lista de errores
          if (((error as { name?: string }).name === 'MongoServerError' && (error as { code?: number }).code === 11000) ||
            (error as { code?: string }).code === 'FILE_ALREADY_EXISTS') {
            errors.push({
              file: processedFile.originalname,
              error: `Ya existe un archivo con el nombre "${processedFile.originalname}" en esta biblioteca`
            });
          } else {
            errors.push({
              file: processedFile.originalname,
              error: (error as Error).message
            });
          }
        }
      }

      // Añadir los archivos fallidos del proceso de upload
      for (const failedFile of uploadResult.failed) {
        errors.push({
          file: failedFile.file.name,
          error: (failedFile.error as { message: string }).message
        });
      }

      // Enviar respuesta con resultados
      this.sendSuccessResponse(res, {
        success: mediaItems,
        errors: errors,
        totalSuccess: mediaItems.length,
        totalErrors: errors.length,
        total: uploadResult.successful.length + uploadResult.failed.length
      }, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Maneja la subida de una sola imagen
   */
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar si se ha subido un archivo
      if (!req.file) {
        throw useBadRequestError('No se ha subido ninguna imagen');
      }

      // Verificar que el archivo es una imagen
      if (!req.file.mimetype.startsWith('image/')) {
        throw useBadRequestError('El archivo subido no es una imagen');
      }

      // Extraer el ID de la biblioteca
      const libraryId = req.body.libraryId || req.query.libraryId;
      if (!libraryId) {
        throw useBadRequestError('Se requiere un ID de biblioteca para subir la imagen');
      }

      // Usar el hook de upload para procesar el archivo
      const { uploadSingleImage } = useUpload();
      const processedFile = await uploadSingleImage(req.file, {
        libraryId,
        userId: req.body.user_id,
        folderId: req.body.folder_id,
        tags: req.body.tags,
        metadata: req.body.metadata,
        isPublic: req.body.isPublic !== 'false'
      });

      try {
        // Crear el registro en la base de datos
        const mediaData: Partial<IMedia> = {
          filename: processedFile.filename,
          originalFilename: processedFile.originalname,
          type: 'image',
          mimeType: processedFile.mimetype,
          size: processedFile.size,
          storage: processedFile.storage,
          library_id: processedFile.libraryId,
          library_name: req.body.library_name,
          library_slug: req.body.library_slug,
          folder_id: processedFile.folderId,
          tag_ids: processedFile.tags ? processedFile.tags.split(',') : undefined,
          user_id: processedFile.userId,
          metadata: req.body.metadata,
          variants: processedFile.thumbnails
        };

        const media = await this.service.create(mediaData as ICreateMedia);

        // Enviar respuesta
        this.sendSuccessResponse(res, mediaToResponse(media as never), 201);
      } catch (dbError: unknown) {
        // Capturar errores específicos de la base de datos
        if ((dbError as { code?: string }).code === 'FILE_ALREADY_EXISTS' ||
          ((dbError as { name?: string }).name === 'MongoServerError' && (dbError as { code?: number }).code === 11000)) {
          res.status(400).json({
            status: 'error',
            code: 'FILE_ALREADY_EXISTS',
            message: `Ya existe una imagen con el nombre "${processedFile.originalname}" en esta biblioteca`
          });
          return;
        }

        // Otros errores de base de datos
        next(dbError);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Maneja la subida de múltiples imágenes
   */
  uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar si se han subido archivos
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw useBadRequestError('No se han subido imágenes');
      }

      // Verificar que todos los archivos son imágenes
      const nonImageFiles = (req.files as Express.Multer.File[]).filter(
        file => !file.mimetype.startsWith('image/')
      );
      if (nonImageFiles.length > 0) {
        throw useBadRequestError(`${nonImageFiles.length} archivo(s) no son imágenes`);
      }

      // Extraer el ID de la biblioteca
      const libraryId = req.body.libraryId || req.query.libraryId;
      if (!libraryId) {
        throw useBadRequestError('Se requiere un ID de biblioteca para subir las imágenes');
      }

      // Usar el hook de upload para procesar los archivos
      const { uploadMultipleImages } = useUpload();
      const uploadResult = await uploadMultipleImages(req.files, {
        libraryId,
        userId: req.body.user_id,
        folderId: req.body.folder_id,
        tags: req.body.tags,
        metadata: req.body.metadata,
        isPublic: req.body.isPublic !== 'false'
      });

      // Guardar los archivos en la base de datos
      const mediaItems = [];
      const errors = [];

      for (const processedFile of uploadResult.successful) {
        try {
          const mediaData: Partial<IMedia> = {
            filename: processedFile.filename,
            originalFilename: processedFile.originalname,
            type: 'image',
            mimeType: processedFile.mimetype,
            size: processedFile.size,
            storage: processedFile.storage,
            library_id: processedFile.libraryId,
            library_name: req.body.library_name,
            library_slug: req.body.library_slug,
            folder_id: processedFile.folderId,
            tag_ids: processedFile.tags ? processedFile.tags.split(',') : undefined,
            user_id: processedFile.userId,
            metadata: req.body.metadata,
            variants: processedFile.thumbnails
          };

          const media = await this.service.create(mediaData as ICreateMedia);
          mediaItems.push(mediaToResponse(media as never));
        } catch (error: unknown) {
          // Si es un error de duplicidad, añadir a la lista de errores
          if (((error as { name?: string }).name === 'MongoServerError' && (error as { code?: number }).code === 11000) ||
            (error as { code?: string }).code === 'FILE_ALREADY_EXISTS') {
            errors.push({
              file: processedFile.originalname,
              error: `Ya existe una imagen con el nombre "${processedFile.originalname}" en esta biblioteca`
            });
          } else {
            errors.push({
              file: processedFile.originalname,
              error: (error as Error).message
            });
          }
        }
      }

      // Añadir los archivos fallidos del proceso de upload
      for (const failedFile of uploadResult.failed) {
        errors.push({
          file: failedFile.file.name,
          error: (failedFile.error as { message: string }).message
        });
      }

      // Enviar respuesta con resultados
      this.sendSuccessResponse(res, {
        success: mediaItems,
        errors: errors,
        totalSuccess: mediaItems.length,
        totalErrors: errors.length,
        total: uploadResult.successful.length + uploadResult.failed.length
      }, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sirve un archivo al cliente mediante proxy (en lugar de redirección)
   * Optimizado para imágenes y mejorar compatibilidad con etiquetas HTML
   */
  proxyFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const librarySlug = req.params.library_slug;
      const fileSlug = req.params.file_slug;

      // Verificar headers condicionales para posible respuesta 304
      const ifModifiedSince = req.headers['if-modified-since'];
      const ifNoneMatch = req.headers['if-none-match'];

      if (!librarySlug || !fileSlug) {
        throw useBadRequestError('Se requiere el slug de la biblioteca y el nombre del archivo');
      }

      const file = await (this.service as ExtendedMediaService).getByFilenameAndLibrarySlug(fileSlug, librarySlug);
      if (!file) {
        return this.sendErrorResponse(res, 'Archivo no encontrado', 404);
      }

      // Generar un ETag basado en metadatos del archivo
      const etag = `"${file.updatedAt?.getTime() || file._id}-${file.size || 0}"`;

      // Comprobar si podemos devolver 304 Not Modified
      if ((ifNoneMatch && ifNoneMatch === etag) ||
        (ifModifiedSince && file.updatedAt && new Date(ifModifiedSince) >= file.updatedAt)) {
        res.status(304).end();
        return;
      }

      // Importar el hook de almacenamiento
      const { getFileUrl } = useStorage();

      // Determinar la ruta del archivo en el almacenamiento
      let filePath = file.storage.path;

      // Si el propio fileSlug incluye un prefijo de variante (thumb_sm, thumb_md, etc.)
      // buscar la variante correspondiente
      if (file.variants && file.variants.length > 0) {
        // Verificar si el slug solicitado comienza con algún prefijo de variante
        const thumbPrefixes = ['thumbsm-', 'thumbmd-', 'thumblg-'];
        for (const prefix of thumbPrefixes) {
          if (fileSlug.startsWith(prefix)) {
            // Encontrar la variante correspondiente (thumb_sm, thumb_md, thumb_lg)
            const variantName = prefix === 'thumbsm-' ? 'thumb_sm' :
              prefix === 'thumbmd-' ? 'thumb_md' : 'thumb_lg';

            const requestedVariant = file.variants?.find((v) => (v as { variant: string; path: string }).variant === variantName);
            if (requestedVariant) {
              filePath = (requestedVariant as { variant: string; path: string }).path;
              break;
            }
          }
        }
      }

      // Por defecto, las URLs expirarán en 1 hora (3600 segundos)
      const expiresIn = 3600;

      // Obtener la URL del archivo
      const fileUrl = await getFileUrl(filePath, expiresIn, true);

      // Seleccionar el módulo http o https dependiendo de la URL
      const httpModule = fileUrl.startsWith('https') ? https : http;

      // Configurar cabeceras para optimizar caché y rendimiento
      if (file.mimeType) {
        res.setHeader('Content-Type', file.mimeType);
      }

      // Configurar cabeceras de caché
      // 1 día para archivos estáticos (86400 segundos)
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());

      // Añadir ETag para verificaciones condicionales futuras
      res.setHeader('ETag', etag);

      // Si conocemos la fecha de última modificación, añadirla
      if (file.updatedAt) {
        res.setHeader('Last-Modified', file.updatedAt.toUTCString());
      }

      // Configuración CORS mejorada para resolver problemas de NotSameOrigin
      // Permitir solicitudes desde cualquier origen
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      // Esta cabecera es crítica para permitir credenciales en solicitudes cross-origin
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      // Evitar caché específica de CORS que puede mantener políticas restrictivas
      res.setHeader('Vary', 'Origin');
      // Establecer política de Cross-Origin-Resource-Policy para permitir cross-origin
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Política de Referrer para mayor compatibilidad
      res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

      // Opciones mejoradas para la solicitud HTTP
      const requestOptions = {
        headers: {
          // Asegurarse de que la solicitud al origen incluya también headers adecuados
          'User-Agent': req.headers['user-agent'] || 'API-Proxy',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate'
        }
      };

      // Realizar una solicitud HTTP para obtener el archivo y enviarlo al cliente
      httpModule.get(fileUrl, requestOptions, (fileResponse: http.IncomingMessage) => {
        // Pasar el tamaño del archivo al cliente si está disponible
        if (file.size) {
          res.setHeader('Content-Length', file.size);
        }

        // Transferir cualquier header de contenido relevante desde la respuesta
        // pero mantener nuestros headers CORS propios
        if (fileResponse.headers['content-type'] && !res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', fileResponse.headers['content-type']);
        }

        // Canalizar la respuesta directamente al cliente
        fileResponse.pipe(res);

        // Manejar errores en la respuesta
        fileResponse.on('error', (err: Error) => {
          this.logger.error('Error al recibir datos del almacenamiento', { error: err });
          next(err);
        });
      }).on('error', (err: Error) => {
        this.logger.error('Error al conectar con el almacenamiento', { error: err });
        next(err);
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Descarga un archivo
   */
  downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const librarySlug = req.params.library_slug;
      const fileSlug = req.params.file_slug;

      if (!librarySlug || !fileSlug) {
        throw useBadRequestError('Se requiere el slug de la biblioteca y el nombre del archivo');
      }

      const file = await (this.service as ExtendedMediaService).getByFilenameAndLibrarySlug(fileSlug, librarySlug);
      if (!file) {
        return this.sendErrorResponse(res, 'Archivo no encontrado', 404);
      }

      // Importar el hook de almacenamiento
      const { getFileUrl } = useStorage();

      // Determinar la ruta del archivo en el almacenamiento
      let filePath = file.storage.path;

      // Por defecto, las URLs expirarán en 1 hora (3600 segundos)
      const expiresIn = 3600;

      // Obtener la URL del archivo
      const fileUrl = await getFileUrl(filePath, expiresIn, true);

      // Seleccionar el módulo http o https dependiendo de la URL
      const httpModule = fileUrl.startsWith('https') ? https : http;

      // Configurar los headers para forzar la descarga
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
      if (file.mimeType) {
        res.setHeader('Content-Type', file.mimeType);
      }

      // Realizar una solicitud HTTP para obtener el archivo y enviarlo al cliente
      httpModule.get(fileUrl, (fileResponse: http.IncomingMessage) => {
        // Pasar el tamaño del archivo al cliente si está disponible
        if (file.size) {
          res.setHeader('Content-Length', file.size);
        }

        // Canalizar la respuesta directamente al cliente
        fileResponse.pipe(res);

        // Manejar errores en la respuesta
        fileResponse.on('error', (err: Error) => {
          next(err);
        });
      }).on('error', (err: Error) => {
        next(err);
      });
    } catch (error) {
      next(error);
    }
  };
} 