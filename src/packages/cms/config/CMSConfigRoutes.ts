/**
 * Rutas para la configuración del CMS
 * 
 * Endpoints públicos para que el frontend pueda acceder a la configuración
 * de idiomas y otras configuraciones del CMS.
 */

import { Router } from 'express';
import { CMSConfigController } from './CMSConfigController';
import { authenticate } from '@core/middleware/authMiddleware';

// Instanciar el controlador
const cmsConfigController = new CMSConfigController();

// Crear el router
const router = Router();

/**
 * Definición de rutas para configuración del CMS
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/cms-config - Configuración completa del CMS
router.get('/', cmsConfigController.getFullConfig);

// GET /api/cms-config/locales - Solo configuración de idiomas
router.get('/locales', cmsConfigController.getLocalesConfig);

// GET /api/cms-config/locales/supported - Solo códigos de idiomas soportados
router.get('/locales/supported', cmsConfigController.getSupportedLocales);

// GET /api/cms-config/locales/:localeCode - Información de un idioma específico
router.get('/locales/:localeCode', cmsConfigController.getLocaleInfo);

// GET /api/cms-config/publication-types - Configuración de tipos de publicación
router.get('/publication-types', cmsConfigController.getPublicationTypesConfig);

// GET /api/cms-config/publication-types/:typeKey - Información de un tipo de publicación específico
router.get('/publication-types/:typeKey', cmsConfigController.getPublicationTypeInfo);

// GET /api/cms-config/health - Health check de la configuración CMS
router.get('/health', cmsConfigController.healthCheck);

export const CMSConfigRoutes = router; 