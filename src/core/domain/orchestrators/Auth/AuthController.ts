import { Request, Response, NextFunction } from 'express';
import { AuthOrchestrator } from './AuthOrchestrator';

/**
 * Controlador para las operaciones de autenticación
 * Delega la lógica de negocio al AuthOrchestrator
 */
export class AuthController {
  constructor(private authOrchestrator: AuthOrchestrator) {}

  /**
   * Iniciar sesión
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const headers = {
        ip_address: req.ip,
        origin: req.get('Origin'),
        agent: req.get('User-Agent')
      };

      const result = await this.authOrchestrator.login(email, password, headers);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refrescar token
   */
  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshData = {
        ...req.body,
        ip_address: req.ip,
        origin: req.get('Origin'),
        agent: req.get('User-Agent')
      };

      const result = await this.authOrchestrator.refresh(refreshData);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cerrar sesión
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      await this.authOrchestrator.logout(refreshToken);
      
      res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authOrchestrator.forgotPassword(req.body);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar token de recuperación (redireccionar)
   */
  verifyRecoveryToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      
      const redirectUrl = await this.authOrchestrator.verifyRecoveryToken(token);
      
      // Redirigir al frontend con el token
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restablecer contraseña
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authOrchestrator.resetPassword(req.body);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}