/**
 * Rutas para Prueba
 */
import { Router, Request, Response, NextFunction } from 'express';
import { PruebaController } from './PruebaController';
import { authenticate } from '@core/middleware/authMiddleware';

// Crear el router
const router = Router();
router.use(authenticate);

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getPruebaController = (req: Request): PruebaController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<PruebaController>('pruebaController');
};

/**
 * Definición de rutas para Prueba
 */

// Rutas que requieren autenticación

// GET /api/pruebas - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.get(req, res, next);
});

// GET /api/pruebas/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.findById(req, res, next);
});

// POST /api/pruebas - Crear un nuevo elemento
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.create(req, res, next);
});

// PUT /api/pruebas/:_id - Actualizar un elemento
router.put('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.update(req, res, next);
});

// DELETE /api/pruebas/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.delete(req, res, next);
});

// PATCH /api/pruebas/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/pruebas/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getPruebaController(req);
  controller.restore(req, res, next);
});

export const PruebaRoutes = router; 