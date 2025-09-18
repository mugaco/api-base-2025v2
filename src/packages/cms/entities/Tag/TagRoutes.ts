/**
 * Rutas para Tag
 */
import { Router } from 'express';
import { TagController } from './TagController';
import { TagService } from './TagService';
import { TagRepository } from './TagRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateTagSchema, UpdateTagSchema } from './TagSchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaTagMiddleware } from '@packages/cms/middlewares/aplanaTagMiddleware';

// Instanciar dependencias
const tagRepository = new TagRepository();
const tagService = new TagService(tagRepository);
const tagController = new TagController(tagService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Tag
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/tags - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaTagMiddleware, tagController.get);

// GET /api/tags/search - Buscar elementos
router.get('/search', tagController.search);

// GET /api/tags/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaTagMiddleware, tagController.getById);

// POST /api/tags - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateTagSchema),
  tagController.create
);

// PUT /api/tags/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateTagSchema),
  tagController.update
);

// DELETE /api/tags/:_id - Eliminar un elemento
router.delete('/:_id', tagController.delete);

// PATCH /api/tags/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', tagController.softDelete);

// PATCH /api/tags/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', tagController.restore);

export const TagRoutes = router; 