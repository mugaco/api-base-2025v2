/**
 * Rutas públicas para Publication (solo lectura con API Key)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { PublicationController } from './PublicationController';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaPublicationMiddleware } from '@packages/cms/middlewares/aplanaPublicationMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getPublicationController = (req: Request): PublicationController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<PublicationController>('publicationController');
};

/**
 * Rutas públicas para Publication - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/publication-public - Obtener publicaciones públicas
router.get('/', aplanaPublicationMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.get(req, res, next);
});

// GET /api/publication-public/:_id - Obtener una publicación por ID
router.get('/:_id', aplanaPublicationMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.getById(req, res, next);
});

// GET /api/publication-public/slug/:slug - Obtener una publicación por slug
router.get('/slug/:slug/locale/:locale', aplanaPublicationMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.getBySlug(req, res, next);
});

// GET /api/publication-public/validate/slug/:slug - Validar slug (útil para frontends)
router.get('/validate/slug/:slug', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.validateSlug(req, res, next);
});

export const PublicationPublicRoutes = router;