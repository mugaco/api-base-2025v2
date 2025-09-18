/**
 * Rutas para Media
 */
import { Router } from 'express';
import { MediaController } from './MediaController';
import { MediaService } from './MediaService';
import { MediaRepository } from './MediaRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { UpdateMediaSchema } from './MediaSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { handleSingleFileUpload, handleMultipleFilesUpload } from './middlewares/multerMiddlewate';
import { addLibrarySlugNameMiddleware } from './middlewares/addLibrarySlugNameMiddleware';
// Instanciar dependencias
const mediaRepository = new MediaRepository();
const mediaService = new MediaService(mediaRepository);
const mediaController = new MediaController(mediaService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Media
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', mediaController.get);

// GET /api/media/search - Buscar elementos
router.get('/search', mediaController.search);

// GET /api/media/:_id - Obtener un elemento por ID
router.get('/:_id', mediaController.getById);

// PUT /api/media/:_id - Actualizar un elemento
router.put(
  '/:_id',
  addLibrarySlugNameMiddleware,
  validateZodSchema(UpdateMediaSchema),
  mediaController.update
);

// DELETE /api/media/:_id - Eliminar un elemento
router.delete('/:_id', mediaController.delete);

// PATCH /api/media/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', mediaController.softDelete);

// PATCH /api/media/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', mediaController.restore);

// Nuevas rutas para subida de archivos
// POST /api/media/upload - Subir un archivo
router.post(
  '/upload-file',
  handleSingleFileUpload,
  addLibrarySlugNameMiddleware,
  mediaController.uploadFile
);

// POST /api/media/upload-multiple - Subir múltiples archivos
router.post(
  '/upload-multiple-files',
  handleMultipleFilesUpload,
  addLibrarySlugNameMiddleware,
  mediaController.uploadFiles
);

// POST /api/media/upload - Subir un archivo
router.post(
  '/upload-image',
  handleSingleFileUpload,
  addLibrarySlugNameMiddleware,
  mediaController.uploadImage
);

// POST /api/media/upload-multiple - Subir múltiples archivos
router.post(
  '/upload-multiple-images',
  handleMultipleFilesUpload,
  addLibrarySlugNameMiddleware,
  mediaController.uploadImages
);



export const MediaRoutes = router; 