/**
 * Rutas para Order
 * Define los endpoints y sus validaciones
 */
import { Router, Request, Response, NextFunction } from 'express';
import { OrderController } from './OrderController';
import { authenticate } from '@core/middleware/authMiddleware';
// TODO: Importar middleware de validación si es necesario
// import validateZodSchema from '@core/middleware/validateZodSchema';
// TODO: Importar esquemas de validación Zod si los hay
// import { CreateSchema, UpdateSchema } from './OrderSchema';

// Crear el router
const router = Router();

router.use(authenticate);
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getOrderController = (req: Request): OrderController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<OrderController>('orderController');
};

/**
 * Definición de rutas para Order
 */

// TODO: Definir las rutas necesarias
// Ejemplo:
// POST /api/orders/process
router.post(
  '/process',
  // TODO: Agregar validación con Zod si es necesario
  // validateZodSchema(ProcessSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getOrderController(req);
    controller.executeOrder(req, res, next);
  }
);

// TODO: Agregar más rutas según sea necesario
// GET /api/orders/status
// PUT /api/orders/update
// DELETE /api/orders/cancel

export const OrderRoutes = router;