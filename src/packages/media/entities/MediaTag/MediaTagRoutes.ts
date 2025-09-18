/**
 * Rutas para MediaTag
 */
import { Router } from 'express';
import { MediaTagController } from './MediaTagController';
import { MediaTagService } from './MediaTagService';
import { MediaTagRepository } from './MediaTagRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateMediaTagSchema, UpdateMediaTagSchema } from './MediaTagSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware';
// Instanciar dependencias
const mediaTagRepository = new MediaTagRepository();
const mediaTagService = new MediaTagService(mediaTagRepository);
const mediaTagController = new MediaTagController(mediaTagService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para MediaTag
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media-tags - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', mediaTagController.get);

// GET /api/media-tags/search - Buscar elementos
router.get('/search', mediaTagController.search);

// GET /api/media-tags/:_id - Obtener un elemento por ID
router.get('/:_id', mediaTagController.getById);

// POST /api/media-tags - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateMediaTagSchema),
  mediaTagController.create
);

// PUT /api/media-tags/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateMediaTagSchema),
  mediaTagController.update
);

// DELETE /api/media-tags/:_id - Eliminar un elemento
router.delete('/:_id', mediaTagController.delete);

// PATCH /api/media-tags/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', mediaTagController.softDelete);

// PATCH /api/media-tags/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', mediaTagController.restore);

export const MediaTagRoutes = router; 