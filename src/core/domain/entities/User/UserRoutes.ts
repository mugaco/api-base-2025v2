import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from './UserController';
import { authenticate } from '@core/middleware/authMiddleware';
import { authorize } from '@core/middleware/authorizeMiddleware';
// import { UserRole } from './UserModel';
import validateZodSchema from '@core/middleware/validateZodSchema';
import { CreateUserSchema, UpdatePasswordSchema, UpdateUserSchema } from './UserSchema';

// Crear router
const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getUserController = (req: Request): UserController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<UserController>('userController');
};

// Rutas públicas
router.post('/register', validateZodSchema(CreateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.register(req, res, next);
});

// Rutas protegidas - perfil propio
router.get('/profile', authenticate, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.getProfile(req, res, next);
});

router.put('/profile', authenticate, validateZodSchema(UpdateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.update(req, res, next);
});

// Rutas protegidas - admin
router.get('/', authenticate, authorize, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.get(req, res, next);
});

router.get('/:_id', authenticate, authorize, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.findById(req, res, next);
});

router.post('/', authenticate, authorize, validateZodSchema(CreateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.create(req, res, next);
});

router.put('/:_id', authenticate, authorize, validateZodSchema(UpdateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.update(req, res, next);
});

router.delete('/:_id', authenticate, authorize, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.delete(req, res, next);
});

router.patch('/:_id/soft-delete', authenticate, authorize, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.softDelete(req, res, next);
});

router.patch('/:_id/restore', authenticate, authorize, (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.restore(req, res, next);
});

router.put('/update-profile/:_id', authenticate, authorize, validateZodSchema(UpdateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.updateProfile(req, res, next);
});

router.put('/update-password/:_id', authenticate, authorize, validateZodSchema(UpdatePasswordSchema), (req: Request, res: Response, next: NextFunction) => {
  const controller = getUserController(req);
  controller.updatePassword(req, res, next);
});

export const UserRoutes = router; 