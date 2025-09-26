import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { ICreateUser, IUpdateUser, IUpdatePassword } from './UserSchema';
import { UserService } from './UserService';

/**
 * Controlador para la entidad User heredando de BaseController
 */
export class UserController extends BaseController<UserService> {
  constructor(userService: UserService) {
    super(userService);
  }


  // Métodos específicos del controlador de usuarios
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: ICreateUser = req.body;
      const user = await (this.service as UserService).register(userData);

      this.sendSuccessResponse(res, user, 201);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return this.sendErrorResponse(res, 'Usuario no autenticado', 401);
      }

      const user = await this.service.findById(req.user._id);

      this.sendSuccessResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const data = req.body as IUpdateUser;
      const updatedUser = await (this.service as UserService).updateProfile(_id, data);

      this.sendSuccessResponse(res, updatedUser);
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const data = req.body as IUpdatePassword;
      const updatedUser = await (this.service as UserService).updatePassword(_id, data);

      this.sendSuccessResponse(res, updatedUser);
    } catch (error) {
      next(error);
    }
  }
} 