/**
 * Rutas para Category
 */
import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from './CategoryController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateCategorySchema, UpdateCategorySchema } from './CategorySchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaCategoryMiddleware } from '@packages/cms/middlewares/aplanaCategoryMiddleware';

// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getCategoryController = (req: Request): CategoryController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<CategoryController>('categoryController');
};

/**
 * Definición de rutas para Category
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/categories - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaCategoryMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.get(req, res, next);
});

// GET /api/categories/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.search(req, res, next);
});

// GET /api/categories/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaCategoryMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.findById(req, res, next);
});

// POST /api/categories - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateCategorySchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.create(req, res, next);
}
);

// PUT /api/categories/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateCategorySchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/categories/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.delete(req, res, next);
});

// PATCH /api/categories/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/categories/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.restore(req, res, next);
});

export const CategoryRoutes = router; 