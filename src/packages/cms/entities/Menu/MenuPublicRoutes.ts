/**
 * Rutas públicas para Menu (solo lectura con API Key)
 */
import { Router } from 'express';
import { MenuController } from './MenuController';
import { MenuService } from './MenuService';
import { MenuRepository } from './MenuRepository';
import { apiKeyMiddleware } from '@core/middleware/apiKeyMiddleware';
// Middleware de aplanación automática de traducciones CMS
import { aplanaMenuMiddleware } from '@packages/cms/middlewares/aplanaMenuMiddleware';

// Instanciar dependencias (reutilizamos las mismas instancias)
const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// Crear el router
const router = Router();

/**
 * Rutas públicas para Menu - Solo lectura con API Key
 */

// Middleware de validación de API Key para todas las rutas públicas
router.use(apiKeyMiddleware);

// GET /api/menu-public - Obtener menús públicos
router.get('/', aplanaMenuMiddleware, menuController.get);

// GET /api/menu-public/search - Buscar menús públicos
router.get('/search', menuController.search);

// GET /api/menu-public/:_id - Obtener un menú por ID
router.get('/:_id', aplanaMenuMiddleware, menuController.getById);

export const MenuPublicRoutes = router;