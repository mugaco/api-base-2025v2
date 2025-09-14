/**
 * Rutas para Access CRUD
 * Solo maneja operaciones CRUD sobre la entidad Access
 * Las operaciones de autenticación se movieron a /auth
 */
import { Router, Request, Response, NextFunction } from 'express';
import { AccessController } from './AccessController';
import { authenticate } from '@core/middleware/authMiddleware';
import { authorize } from '@core/middleware/authorizeMiddleware';

// Crear router
const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getAccessController = (req: Request): AccessController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<AccessController>('accessController');
};

// Todas las rutas requieren autenticación
router.use(authenticate);
router.use(authorize);

// Rutas CRUD para Access (solo administradores)
// GET /api/access - Obtener accesos
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getAccessController(req);
  controller.get(req, res, next);
});

// GET /api/access/:_id - Obtener acceso por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getAccessController(req);
  controller.getById(req, res, next);
});

// DELETE /api/access/:_id - Eliminar acceso
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getAccessController(req);
  controller.delete(req, res, next);
});

export const AccessRoutes = router;