/**
 * Rutas públicas para Category (solo lectura con API Key)
 */
import { Router } from 'express';
import { CategoryController } from './CategoryController';
import { CategoryService } from './CategoryService';
import { CategoryRepository } from './CategoryRepository';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaCategoryMiddleware } from '@packages/cms/middlewares/aplanaCategoryMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

// Crear el router
const router = Router();

/**
 * Rutas públicas para Category - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/category-public - Obtener categorías públicas
router.get('/', aplanaCategoryMiddleware, categoryController.get);

// GET /api/category-public/search - Buscar categorías públicas
router.get('/search', categoryController.search);

// GET /api/category-public/:_id - Obtener una categoría por ID
router.get('/:_id', aplanaCategoryMiddleware, categoryController.getById);

export const CategoryPublicRoutes = router;