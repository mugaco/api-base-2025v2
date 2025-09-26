/**
 * Rutas públicas para Category (solo lectura con API Key)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from './CategoryController';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaCategoryMiddleware } from '@packages/cms/middlewares/aplanaCategoryMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
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
 * Rutas públicas para Category - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/category-public - Obtener categorías públicas
router.get('/', aplanaCategoryMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.get(req, res, next);
});

// GET /api/category-public/search - Buscar categorías públicas
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.search(req, res, next);
});

// GET /api/category-public/:_id - Obtener una categoría por ID
router.get('/:_id', aplanaCategoryMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getCategoryController(req);
  controller.findById(req, res, next);
});

export const CategoryPublicRoutes = router;