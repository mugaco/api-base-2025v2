/**
 * Rutas para el orquestador PruebaTest
 */
import { Router, Request, Response } from 'express';
import { PruebaTestController } from './PruebaTestController';

const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getPruebaTestController = (req: Request): PruebaTestController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<PruebaTestController>('pruebaTestController');
};

/**
 * GET /api/prueba-test/find-doble/:prueba_id/:test_id
 * Busca una Prueba y un Test por sus IDs y retorna un objeto merged
 */
router.get('/find-doble/:prueba_id/:test_id', (req: Request, res: Response) => {
  const controller = getPruebaTestController(req);
  controller.findDoble(req, res);
});

export { router as pruebaTestRoutes };