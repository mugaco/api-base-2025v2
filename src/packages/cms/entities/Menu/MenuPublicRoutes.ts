/**
 * Rutas públicas para Menu (solo lectura con API Key)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { MenuController } from './MenuController';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaMenuMiddleware } from '@packages/cms/middlewares/aplanaMenuMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
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
 * Rutas públicas para Menu - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/menu-public - Obtener menús públicos
router.get('/', aplanaMenuMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.get(req, res, next);
});

// GET /api/menu-public/search - Buscar menús públicos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.search(req, res, next);
});

// GET /api/menu-public/:_id - Obtener un menú por ID
router.get('/:_id', aplanaMenuMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getMenuController(req);
  controller.findById(req, res, next);
});

export const MenuPublicRoutes = router;