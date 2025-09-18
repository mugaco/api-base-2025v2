/**
 * Rutas para Publication
 */
import { Router } from 'express';
import { PublicationController } from './PublicationController';
import { PublicationService } from './PublicationService';
import { PublicationRepository } from './PublicationRepository';
import { MediaRepository } from '@packages/media/entities/Media/MediaRepository';
import { MediaService } from '@packages/media/entities/Media/MediaService';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { 
  CreatePublicationSchema, 
  UpdatePublicationSchema, 
  MinimalPublicationSchema,
  UpdateGlobalStatusSchema,
  UpdatePublicationTypeSchema,
  UpdateCategoriesSchema,
  UpdateTagsSchema,
  UpdateFeaturedImageSchema,
  UpdateGallerySchema
} from './PublicationSchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaPublicationMiddleware } from '@packages/cms/middlewares/aplanaPublicationMiddleware';
import { preparePublicationMiddleware } from '@packages/cms/middlewares/preparePublicationMiddleware';

// Instanciar dependencias
const publicationRepository = new PublicationRepository();
const mediaRepository = new MediaRepository();
const mediaService = new MediaService(mediaRepository);
const publicationService = new PublicationService(publicationRepository, mediaService);
const publicationController = new PublicationController(publicationService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Publication
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/publication/validate/slug/:slug - Validar slug único (ENDPOINT 6)
router.get('/validate/slug/:slug', publicationController.validateSlug);

// GET /api/publication - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaPublicationMiddleware, publicationController.get);

// GET /api/publication/search - Buscar elementos
router.get('/search', publicationController.search);

// GET /api/publication/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaPublicationMiddleware, publicationController.getById);

// GET /api/publication/get-publication-media/:publication_id - Obtener media de una publicación
router.get('/get-publication-media/:publication_id', publicationController.getPublicationMedia);

// PUT /api/publication/:_id/create-locale/:locale - Crear contenido por idioma
router.put('/:_id/create-locale/:locale', publicationController.createByLocale);
// PUT /api/publication/:_id/update-locale/:locale - Actualizar contenido por idioma 
router.put('/:_id/update-locale/:locale', publicationController.updateByLocale);
// DELETE /api/publication/:_id/delete-locale/:locale - Eliminar idioma específico 
router.delete('/:_id/delete-locale/:locale', publicationController.deleteByLocale);

// PATCH /api/publication/:_id/locale/:locale/status - Cambiar estado por idioma (ENDPOINT 4)
router.patch('/:_id/locale/:locale/status', publicationController.updateStatusByLocale);

// POST /api/publication - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(MinimalPublicationSchema),
  preparePublicationMiddleware,
  validateZodSchema(CreatePublicationSchema),
  publicationController.create
);

// PUT /api/publication/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdatePublicationSchema),
  publicationController.update
);

// DELETE /api/publication/:_id - Eliminar un elemento
router.delete('/:_id', publicationController.delete);

// PATCH /api/publication/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', publicationController.softDelete);

// PATCH /api/publication/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', publicationController.restore);

// NUEVOS ENDPOINTS ESPECIALIZADOS PATCH

// PATCH /api/publication/:_id/global-status - Actualizar estado global
router.patch(
  '/:_id/global-status',
  validateZodSchema(UpdateGlobalStatusSchema),
  publicationController.updateGlobalStatus
);

// PATCH /api/publication/:_id/type - Actualizar tipo de publicación
router.patch(
  '/:_id/type',
  validateZodSchema(UpdatePublicationTypeSchema),
  publicationController.updatePublicationType
);

// PATCH /api/publication/:_id/categories - Actualizar categorías
router.patch(
  '/:_id/categories',
  validateZodSchema(UpdateCategoriesSchema),
  publicationController.updateCategories
);

// PATCH /api/publication/:_id/tags - Actualizar tags
router.patch(
  '/:_id/tags',
  validateZodSchema(UpdateTagsSchema),
  publicationController.updateTags
);

// PATCH /api/publication/:_id/featured-image - Actualizar imagen destacada
router.patch(
  '/:_id/featured-image',
  validateZodSchema(UpdateFeaturedImageSchema),
  publicationController.updateFeaturedImage
);

// PATCH /api/publication/:_id/gallery - Actualizar galería de imágenes
router.patch(
  '/:_id/gallery',
  validateZodSchema(UpdateGallerySchema),
  publicationController.updateGallery
);

export const PublicationRoutes = router; 