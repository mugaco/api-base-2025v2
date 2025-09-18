/**
 * Rutas para Category
 */
import { Router } from 'express';
import { CategoryController } from './CategoryController';
import { CategoryService } from './CategoryService';
import { CategoryRepository } from './CategoryRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateCategorySchema, UpdateCategorySchema } from './CategorySchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaCategoryMiddleware } from '@packages/cms/middlewares/aplanaCategoryMiddleware';

// Instanciar dependencias
const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Category
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/categories - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaCategoryMiddleware, categoryController.get);

// GET /api/categories/search - Buscar elementos
router.get('/search', categoryController.search);

// GET /api/categories/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaCategoryMiddleware, categoryController.getById);

// POST /api/categories - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateCategorySchema),
  categoryController.create
);

// PUT /api/categories/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateCategorySchema),
  categoryController.update
);

// DELETE /api/categories/:_id - Eliminar un elemento
router.delete('/:_id', categoryController.delete);

// PATCH /api/categories/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', categoryController.softDelete);

// PATCH /api/categories/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', categoryController.restore);

export const CategoryRoutes = router; 