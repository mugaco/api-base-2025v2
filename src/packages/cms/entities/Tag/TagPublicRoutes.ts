/**
 * Rutas públicas para Tag (solo lectura con API Key)
 */
import { Router } from 'express';
import { TagController } from './TagController';
import { TagService } from './TagService';
import { TagRepository } from './TagRepository';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaTagMiddleware } from '@packages/cms/middlewares/aplanaTagMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
const tagRepository = new TagRepository();
const tagService = new TagService(tagRepository);
const tagController = new TagController(tagService);

// Crear el router
const router = Router();

/**
 * Rutas públicas para Tag - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/tag-public - Obtener tags públicos
router.get('/', aplanaTagMiddleware, tagController.get);

// GET /api/tag-public/search - Buscar tags públicos
router.get('/search', tagController.search);

// GET /api/tag-public/:_id - Obtener un tag por ID
router.get('/:_id', aplanaTagMiddleware, tagController.getById);

export const TagPublicRoutes = router;