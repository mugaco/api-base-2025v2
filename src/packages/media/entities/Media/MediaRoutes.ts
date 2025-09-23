/**
 * Rutas para Media
 */
import { Router, Request, Response, NextFunction } from 'express';
import { MediaController } from './MediaController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { UpdateMediaSchema } from './MediaSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { handleSingleFileUpload, handleMultipleFilesUpload } from './middlewares/multerMiddlewate';
import { addLibrarySlugNameMiddleware } from './middlewares/addLibrarySlugNameMiddleware';
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getMediaController = (req: Request): MediaController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<MediaController>('mediaController');
};

/**
 * Definición de rutas para Media
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.get(req, res, next);
});

// GET /api/media/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.search(req, res, next);
});

// GET /api/media/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.getById(req, res, next);
});

// PUT /api/media/:_id - Actualizar un elemento
router.put(
  '/:_id',
  addLibrarySlugNameMiddleware,
  validateZodSchema(UpdateMediaSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/media/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.delete(req, res, next);
});

// PATCH /api/media/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/media/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.restore(req, res, next);
});

// Nuevas rutas para subida de archivos
// POST /api/media/upload - Subir un archivo
router.post(
  '/upload-file',
  handleSingleFileUpload,
  addLibrarySlugNameMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.uploadFile(req, res, next);
}
);

// POST /api/media/upload-multiple - Subir múltiples archivos
router.post(
  '/upload-multiple-files',
  handleMultipleFilesUpload,
  addLibrarySlugNameMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.uploadFiles(req, res, next);
}
);

// POST /api/media/upload - Subir un archivo
router.post(
  '/upload-image',
  handleSingleFileUpload,
  addLibrarySlugNameMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.uploadImage(req, res, next);
}
);

// POST /api/media/upload-multiple - Subir múltiples archivos
router.post(
  '/upload-multiple-images',
  handleMultipleFilesUpload,
  addLibrarySlugNameMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.uploadImages(req, res, next);
}
);

export const MediaRoutes = router; 