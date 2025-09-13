import { Router, Request, Response, NextFunction } from 'express';
import { TestController } from './TestController';

// Crear el router
const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getTestController = (req: Request): TestController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<TestController>('testController');
};

// GET /api/test - Endpoint de prueba
router.get('/', (req: Request, res: Response, _next: NextFunction) => {
  const controller = getTestController(req);
  controller.test(req, res);
});

export const TestRoutes = router;