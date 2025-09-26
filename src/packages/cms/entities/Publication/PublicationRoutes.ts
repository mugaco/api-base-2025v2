/**
 * Rutas para Publication
 */
import { Router, Request, Response, NextFunction } from 'express';
import { PublicationController } from './PublicationController';
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
 * Definición de rutas para Publication
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/publication/validate/slug/:slug - Validar slug único (ENDPOINT 6)
router.get('/validate/slug/:slug', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.validateSlug(req, res, next);
});

// GET /api/publication - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaPublicationMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.get(req, res, next);
});

// GET /api/publication/search - Buscar elementos
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.search(req, res, next);
});

// GET /api/publication/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaPublicationMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.findById(req, res, next);
});

// GET /api/publication/get-publication-media/:publication_id - Obtener media de una publicación
router.get('/get-publication-media/:publication_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.getPublicationMedia(req, res, next);
});

// PUT /api/publication/:_id/create-locale/:locale - Crear contenido por idioma
router.put('/:_id/create-locale/:locale', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.createByLocale(req, res, next);
});
// PUT /api/publication/:_id/update-locale/:locale - Actualizar contenido por idioma
router.put('/:_id/update-locale/:locale', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.updateByLocale(req, res, next);
});
// DELETE /api/publication/:_id/delete-locale/:locale - Eliminar idioma específico
router.delete('/:_id/delete-locale/:locale', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.deleteByLocale(req, res, next);
});

// PATCH /api/publication/:_id/locale/:locale/status - Cambiar estado por idioma (ENDPOINT 4)
router.patch('/:_id/locale/:locale/status', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.updateStatusByLocale(req, res, next);
});

// POST /api/publication - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(MinimalPublicationSchema),
  preparePublicationMiddleware,
  validateZodSchema(CreatePublicationSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.create(req, res, next);
  }
);

// PUT /api/publication/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdatePublicationSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.update(req, res, next);
  }
);

// DELETE /api/publication/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.delete(req, res, next);
});

// PATCH /api/publication/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/publication/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPublicationController(req);
  controller.restore(req, res, next);
});

// NUEVOS ENDPOINTS ESPECIALIZADOS PATCH

// PATCH /api/publication/:_id/global-status - Actualizar estado global
router.patch(
  '/:_id/global-status',
  validateZodSchema(UpdateGlobalStatusSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updateGlobalStatus(req, res, next);
  }
);

// PATCH /api/publication/:_id/type - Actualizar tipo de publicación
router.patch(
  '/:_id/type',
  validateZodSchema(UpdatePublicationTypeSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updatePublicationType(req, res, next);
  }
);

// PATCH /api/publication/:_id/categories - Actualizar categorías
router.patch(
  '/:_id/categories',
  validateZodSchema(UpdateCategoriesSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updateCategories(req, res, next);
  }
);

// PATCH /api/publication/:_id/tags - Actualizar tags
router.patch(
  '/:_id/tags',
  validateZodSchema(UpdateTagsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updateTags(req, res, next);
  }
);

// PATCH /api/publication/:_id/featured-image - Actualizar imagen destacada
router.patch(
  '/:_id/featured-image',
  validateZodSchema(UpdateFeaturedImageSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updateFeaturedImage(req, res, next);
  }
);

// PATCH /api/publication/:_id/gallery - Actualizar galería de imágenes
router.patch(
  '/:_id/gallery',
  validateZodSchema(UpdateGallerySchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getPublicationController(req);
    controller.updateGallery(req, res, next);
  }
);

export const PublicationRoutes = router; 