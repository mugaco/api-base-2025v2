/**
 * Rutas para las operaciones de autenticación
 * Maneja login, logout, refresh token y recuperación de contraseña
 */
import { Router, Request, Response, NextFunction } from 'express';
import validateZodSchema from '@core/middleware/validateZodSchema';

// Importación desde el barrel de Access
import {
  LoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
  LogoutAllSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../../entities/Access';

import { AuthController } from './AuthController';

// Crear el router
const router = Router();

/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getAuthController = (req: Request): AuthController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<AuthController>('authController');
};

/**
 * Definición de rutas para autenticación
 */

// POST /api/auth/login - Iniciar sesión
router.post(
  '/login',
  validateZodSchema(LoginSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.login(req, res, next);
  }
);

// POST /api/auth/refresh - Refrescar token
router.post(
  '/refresh',
  validateZodSchema(RefreshTokenSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.refresh(req, res, next);
  }
);

// POST /api/auth/logout - Cerrar sesión
router.post(
  '/logout',
  validateZodSchema(LogoutSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.logout(req, res, next);
  }
);

// POST /api/auth/logout-all - Cerrar todas las sesiones
router.post(
  '/logout-all',
  validateZodSchema(LogoutAllSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.logoutAll(req, res, next);
  }
);

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
router.post(
  '/forgot-password',
  validateZodSchema(ForgotPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.forgotPassword(req, res, next);
  }
);

// GET /api/auth/reset-password/:token - Verificar token de recuperación (redirección)
router.get(
  '/reset-password/:token',
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.verifyRecoveryToken(req, res, next);
  }
);

// POST /api/auth/reset-password - Restablecer contraseña
router.post(
  '/reset-password',
  validateZodSchema(ResetPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getAuthController(req);
    controller.resetPassword(req, res, next);
  }
);

export const AuthRoutes = router;