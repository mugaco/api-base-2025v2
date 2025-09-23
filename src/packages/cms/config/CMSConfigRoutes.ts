/**
 * Rutas para la configuración del CMS
 * 
 * Endpoints públicos para que el frontend pueda acceder a la configuración
 * de idiomas y otras configuraciones del CMS.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CMSConfigController } from './CMSConfigController';
import { authenticate } from '@core/middleware/authMiddleware';

// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getCMSConfigController = (req: Request): CMSConfigController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<CMSConfigController>('cmsConfigController');
};

/**
 * Definición de rutas para configuración del CMS
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/cms-config - Configuración completa del CMS
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getFullConfig(req, res, next);
});

// GET /api/cms-config/locales - Solo configuración de idiomas
router.get('/locales', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getLocalesConfig(req, res, next);
});

// GET /api/cms-config/locales/supported - Solo códigos de idiomas soportados
router.get('/locales/supported', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getSupportedLocales(req, res, next);
});

// GET /api/cms-config/locales/:localeCode - Información de un idioma específico
router.get('/locales/:localeCode', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getLocaleInfo(req, res, next);
});

// GET /api/cms-config/publication-types - Configuración de tipos de publicación
router.get('/publication-types', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getPublicationTypesConfig(req, res, next);
});

// GET /api/cms-config/publication-types/:typeKey - Información de un tipo de publicación específico
router.get('/publication-types/:typeKey', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.getPublicationTypeInfo(req, res, next);
});

// GET /api/cms-config/health - Health check de la configuración CMS
router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  const controller = getCMSConfigController(req);
  controller.healthCheck(req, res, next);
});

export const CMSConfigRoutes = router; 