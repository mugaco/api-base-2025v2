/**
 * Rutas para LibraryTag
 */
import { Router } from 'express';
import { LibraryTagController } from './LibraryTagController';
import { LibraryTagService } from './LibraryTagService';
import { LibraryTagRepository } from './LibraryTagRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateLibraryTagSchema, UpdateLibraryTagSchema } from './LibraryTagSchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware'
// Instanciar dependencias
const libraryTagRepository = new LibraryTagRepository();
const libraryTagService = new LibraryTagService(libraryTagRepository);
const libraryTagController = new LibraryTagController(libraryTagService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para LibraryTag
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/library-tags - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', libraryTagController.get);

// GET /api/library-tags/search - Buscar elementos
router.get('/search', libraryTagController.search);

// GET /api/library-tags/:_id - Obtener un elemento por ID
router.get('/:_id', libraryTagController.getById);

// POST /api/library-tags - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateLibraryTagSchema),
  libraryTagController.create
);

// PUT /api/library-tags/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateLibraryTagSchema),
  libraryTagController.update
);

// DELETE /api/library-tags/:_id - Eliminar un elemento
router.delete('/:_id', libraryTagController.delete);

// PATCH /api/library-tags/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', libraryTagController.softDelete);

// PATCH /api/library-tags/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', libraryTagController.restore);

export const LibraryTagRoutes = router; 