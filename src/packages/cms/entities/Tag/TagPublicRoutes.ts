/**
 * Rutas públicas para Tag (solo lectura con API Key)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { TagController } from './TagController';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaTagMiddleware } from '@packages/cms/middlewares/aplanaTagMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getTagController = (req: Request): TagController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<TagController>('tagController');
};

/**
 * Rutas públicas para Tag - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/tag-public - Obtener tags públicos
router.get('/', aplanaTagMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getTagController(req);
  controller.get(req, res, next);
});

// GET /api/tag-public/search - Buscar tags públicos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getTagController(req);
  controller.search(req, res, next);
});

// GET /api/tag-public/:_id - Obtener un tag por ID
router.get('/:_id', aplanaTagMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getTagController(req);
  controller.getById(req, res, next);
});

export const TagPublicRoutes = router;