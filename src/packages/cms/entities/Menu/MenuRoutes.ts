/**
 * Rutas para Menu
 */
import { Router, Request, Response, NextFunction } from 'express';
import { MenuController } from './MenuController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateMenuSchema, UpdateMenuSchema } from './MenuSchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaMenuMiddleware } from '@packages/cms/middlewares/aplanaMenuMiddleware';

// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getMenuController = (req: Request): MenuController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<MenuController>('menuController');
};

/**
 * Definición de rutas para Menu
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/menus - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaMenuMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.get(req, res, next);
});

// GET /api/menus/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.search(req, res, next);
});

// GET /api/menus/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaMenuMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.getById(req, res, next);
});

// POST /api/menus - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateMenuSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.create(req, res, next);
}
);

// PUT /api/menus/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateMenuSchema),
  (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.update(req, res, next);
}
);

// DELETE /api/menus/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.delete(req, res, next);
});

// PATCH /api/menus/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/menus/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.restore(req, res, next);
});

export const MenuRoutes = router; 