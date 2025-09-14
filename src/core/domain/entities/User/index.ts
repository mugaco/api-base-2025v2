/**
 * Barrel export para la entidad User
 * Centraliza todas las exportaciones del módulo User
 */

// Modelo
export { 
  UserModel, 
  IUserModel, 
  UserRole 
} from './UserModel';

// Repositorio
export { UserRepository } from './UserRepository';

// Servicio
export { UserService } from './UserService';

// Controlador
export { UserController } from './UserController';

// Schemas y tipos
export {
  // Schemas
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UpdatePasswordSchema,
  UserResponseSchema,
  
  // Types
  ICreateUser,
  IUpdateUser,
  IUpdatePassword,
  IUserResponse,
  
  // Helper functions
  userToResponse
} from './UserSchema';