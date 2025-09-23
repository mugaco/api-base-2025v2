/**
 * Rutas para Library
 */
import { Router, Request, Response, NextFunction } from 'express';
import { LibraryController } from './LibraryController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateLibrarySchema, UpdateLibrarySchema } from './LibrarySchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware';
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getLibraryController = (req: Request): LibraryController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<LibraryController>('libraryController');
};

/**
 * Definición de rutas para Library
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media-libraries - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.get(req, res, next);
});

// GET /api/media-libraries/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.search(req, res, next);
});

// GET /api/media-libraries/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.getById(req, res, next);
});

// POST /api/media-libraries - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateLibrarySchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.create(req, res, next);
}
);

// PUT /api/media-libraries/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateLibrarySchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/media-libraries/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.delete(req, res, next);
});

// PATCH /api/media-libraries/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/media-libraries/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryController(req);
  controller.restore(req, res, next);
});

export const LibraryRoutes = router; 