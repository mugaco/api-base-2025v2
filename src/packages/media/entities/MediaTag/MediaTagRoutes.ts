/**
 * Rutas para MediaTag
 */
import { Router, Request, Response, NextFunction } from 'express';
import { MediaTagController } from './MediaTagController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateMediaTagSchema, UpdateMediaTagSchema } from './MediaTagSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware';
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getMediaTagController = (req: Request): MediaTagController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<MediaTagController>('mediaTagController');
};

/**
 * Definición de rutas para MediaTag
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media-tags - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.get(req, res, next);
});

// GET /api/media-tags/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.search(req, res, next);
});

// GET /api/media-tags/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.findById(req, res, next);
});

// POST /api/media-tags - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateMediaTagSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.create(req, res, next);
}
);

// PUT /api/media-tags/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateMediaTagSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/media-tags/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.delete(req, res, next);
});

// PATCH /api/media-tags/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/media-tags/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaTagController(req);
  controller.restore(req, res, next);
});

export const MediaTagRoutes = router; 