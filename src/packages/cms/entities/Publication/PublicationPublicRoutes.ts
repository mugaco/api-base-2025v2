/**
 * Rutas públicas para Publication (solo lectura con API Key)
 */
import { Router } from 'express';
import { PublicationController } from './PublicationController';
import { PublicationService } from './PublicationService';
import { PublicationRepository } from './PublicationRepository';
import { MediaRepository } from '@packages/media/entities/Media/MediaRepository';
import { MediaService } from '@packages/media/entities/Media/MediaService';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaPublicationMiddleware } from '@packages/cms/middlewares/aplanaPublicationMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
const publicationRepository = new PublicationRepository();
const mediaRepository = new MediaRepository();
const mediaService = new MediaService(mediaRepository);
const publicationService = new PublicationService(publicationRepository, mediaService);
const publicationController = new PublicationController(publicationService);

// Crear el router
const router = Router();

/**
 * Rutas públicas para Publication - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/publication-public - Obtener publicaciones públicas
router.get('/', aplanaPublicationMiddleware, publicationController.get);


// GET /api/publication-public/:_id - Obtener una publicación por ID
router.get('/:_id', aplanaPublicationMiddleware, publicationController.getById);

// GET /api/publication-public/slug/:slug - Obtener una publicación por slug
router.get('/slug/:slug/locale/:locale', aplanaPublicationMiddleware, publicationController.getBySlug);

// GET /api/publication-public/validate/slug/:slug - Validar slug (útil para frontends)
router.get('/validate/slug/:slug', publicationController.validateSlug);

export const PublicationPublicRoutes = router;