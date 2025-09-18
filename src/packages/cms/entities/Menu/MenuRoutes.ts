/**
 * Rutas para Menu
 */
import { Router } from 'express';
import { MenuController } from './MenuController';
import { MenuService } from './MenuService';
import { MenuRepository } from './MenuRepository';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateMenuSchema, UpdateMenuSchema } from './MenuSchema';
import { authenticate } from '@core/middleware/authMiddleware';
// Middleware de aplanación automática de traducciones CMS
// IMPORTANTE: Solo se activa cuando se envía locale en query (?locale=en-US) o header (X-Locale: en-US)
// Sin locale válido, retorna respuesta completa con array de traducciones
import { aplanaMenuMiddleware } from '@packages/cms/middlewares/aplanaMenuMiddleware';

// Instanciar dependencias
const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// Crear el router
const router = Router();

/**
 * Definición de rutas para Menu
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/menus - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', aplanaMenuMiddleware, menuController.get);

// GET /api/menus/search - Buscar elementos
router.get('/search', menuController.search);

// GET /api/menus/:_id - Obtener un elemento por ID
router.get('/:_id', aplanaMenuMiddleware, menuController.getById);

// POST /api/menus - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateMenuSchema),
  menuController.create
);

// PUT /api/menus/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateMenuSchema),
  menuController.update
);

// DELETE /api/menus/:_id - Eliminar un elemento
router.delete('/:_id', menuController.delete);

// PATCH /api/menus/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', menuController.softDelete);

// PATCH /api/menus/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', menuController.restore);

export const MenuRoutes = router; 