/**
 * Rutas para Library
 */
import { Router } from 'express';
import { LibraryController } from './LibraryController';
import { LibraryService } from './LibraryService';
import { LibraryRepository } from './LibraryRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateLibrarySchema, UpdateLibrarySchema } from './LibrarySchema';
import { authenticate } from '@core/middleware/authMiddleware';
import { createSlugFromNameMiddleware } from '@core/middleware/createSlugFromNameMiddleware';
// Instanciar dependencias
const libraryRepository = new LibraryRepository();
const libraryService = new LibraryService(libraryRepository);
const libraryController = new LibraryController(libraryService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Library
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/media-libraries - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', libraryController.get);

// GET /api/media-libraries/search - Buscar elementos
router.get('/search', libraryController.search);

// GET /api/media-libraries/:_id - Obtener un elemento por ID
router.get('/:_id', libraryController.getById);

// POST /api/media-libraries - Crear un nuevo elemento
router.post(
  '/',
  createSlugFromNameMiddleware,
  validateZodSchema(CreateLibrarySchema),
  libraryController.create
);

// PUT /api/media-libraries/:_id - Actualizar un elemento
router.put(
  '/:_id',
  createSlugFromNameMiddleware,
  validateZodSchema(UpdateLibrarySchema),
  libraryController.update
);

// DELETE /api/media-libraries/:_id - Eliminar un elemento
router.delete('/:_id', libraryController.delete);

// PATCH /api/media-libraries/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', libraryController.softDelete);

// PATCH /api/media-libraries/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', libraryController.restore);

export const LibraryRoutes = router; 