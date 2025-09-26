/**
 * Rutas para LibraryTag
 */
import { Router, Request, Response, NextFunction } from 'express';
import { LibraryTagController } from './LibraryTagController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateLibraryTagSchema, UpdateLibraryTagSchema } from './LibraryTagSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware'
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getLibraryTagController = (req: Request): LibraryTagController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<LibraryTagController>('libraryTagController');
};

/**
 * Definición de rutas para LibraryTag
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/library-tags - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.get(req, res, next);
});

// GET /api/library-tags/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.search(req, res, next);
});

// GET /api/library-tags/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.findById(req, res, next);
});

// POST /api/library-tags - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateLibraryTagSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.create(req, res, next);
}
);

// PUT /api/library-tags/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateLibraryTagSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/library-tags/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.delete(req, res, next);
});

// PATCH /api/library-tags/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/library-tags/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getLibraryTagController(req);
  controller.restore(req, res, next);
});

export const LibraryTagRoutes = router; 