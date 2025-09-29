/**
 * Rutas para Product
 */
import { Router, Request, Response, NextFunction } from 'express';
import { ProductController } from './ProductController';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateProductSchema, UpdateProductSchema } from './ProductSchema';
import { authenticate } from '@core/middleware/authMiddleware';

// Crear el router
const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getProductController = (req: Request): ProductController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<ProductController>('productController');
};

/**
 * Definición de rutas para Product
 */

// Rutas que requieren autenticación
router.use(authenticate);

// GET /api/products - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const controller = getProductController(req);
  controller.get(req, res, next);
});

// GET /api/products/:_id - Obtener un elemento por ID
router.get('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getProductController(req);
  controller.findById(req, res, next);
});

// POST /api/products - Crear un nuevo elemento
router.post(
  '/',
  validateZodSchema(CreateProductSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getProductController(req);
    controller.create(req, res, next);
  }
);

// PUT /api/products/:_id - Actualizar un elemento
router.put(
  '/:_id',
  validateZodSchema(UpdateProductSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getProductController(req);
    controller.update(req, res, next);
  }
);

// DELETE /api/products/:_id - Eliminar un elemento
router.delete('/:_id', (req: Request, res: Response, next: NextFunction) => {
  const controller = getProductController(req);
  controller.delete(req, res, next);
});

// PATCH /api/products/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req: Request, res: Response, next: NextFunction) => {
  const controller = getProductController(req);
  controller.softDelete(req, res, next);
});

// PATCH /api/products/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req: Request, res: Response, next: NextFunction) => {
  const controller = getProductController(req);
  controller.restore(req, res, next);
});

export const ProductRoutes = router;