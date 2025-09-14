// src/core/domain/entitiesUser/UserSchema.ts
import { z } from 'zod';
// import { Document } from 'mongoose';

// Enum para Roles de Usuario
export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  USER = 'user',
}

// Esquema base para User
export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no debe exceder 100 caracteres'),
  email: z.string()
    .email('El formato del email es inválido')
    .min(1, 'El email es obligatorio'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional(),
  role: z.nativeEnum(UserRole)
    .default(UserRole.USER),
  lang: z.string().default('es'),
  avatar: z.string().nullable().optional(),
  theme: z.string().default('dark'),
  metadata: z.record(z.any()).nullable().optional(),
  isDeleted: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Inferir tipo base de User
export type IUser = z.infer<typeof UserSchema>;

// // Tipo para el modelo Mongoose (con métodos adicionales)
// export type IUserModel = IUser & Document & {
//   comparePassword(candidatePassword: string): Promise<boolean>;
// };

// Esquema para creación de usuario
export const CreateUserSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no debe exceder 100 caracteres'),
  email: z.string()
    .email('El formato del email es inválido')
    .min(1, 'El email es obligatorio'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(UserRole),
  lang: z.string(),
  theme: z.string(),
  avatar: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  isDeleted: z.boolean().default(false),
  isActive: z.boolean().default(true)
}).passthrough();

export type ICreateUser = z.infer<typeof CreateUserSchema>;

// Esquema para actualización de usuario (todos los campos opcionales)
export const UpdateUserSchema = UserSchema
  .partial()
  .omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true 
  })
  .passthrough();

export type IUpdateUser = z.infer<typeof UpdateUserSchema>;

// Esquema para login
export const UserLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
}).strict();

export type IUserLogin = z.infer<typeof UserLoginSchema>;

// Esquema para actualización de contraseña
export const UpdatePasswordSchema = z.object({
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .refine((password) => {
      // Contar caracteres no numéricos
      const nonNumericCount = password.replace(/\d/g, '').length;
      return nonNumericCount >= 3;
    }, 'La contraseña debe tener al menos 3 caracteres no numéricos'),
  confirmPassword: z.string()
    .min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres')
    .refine((password) => {
      // Contar caracteres no numéricos
      const nonNumericCount = password.replace(/\d/g, '').length;
      return nonNumericCount >= 3;
    }, 'La confirmación de contraseña debe tener al menos 3 caracteres no numéricos')
}).passthrough().refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas deben coincidir',
  path: ['confirmPassword']
});

export type IUpdatePassword = z.infer<typeof UpdatePasswordSchema>;

// Esquema para respuestas (sin campos sensibles)
export const UserResponseSchema = UserSchema
  .omit({ password: true });

export type IUserResponse = z.infer<typeof UserResponseSchema>;

// Función auxiliar para convertir User a UserResponse (sin campos sensibles)
export const userToResponse = (user: unknown): IUserResponse => {
  // Type guard para verificar si el objeto tiene métodos de Mongoose
  const hasToObject = (obj: unknown): obj is { toObject: () => Record<string, unknown> } => {
    return obj !== null && typeof obj === 'object' && 'toObject' in obj && typeof obj.toObject === 'function';
  };

  const hasToJSON = (obj: unknown): obj is { toJSON: () => Record<string, unknown> } => {
    return obj !== null && typeof obj === 'object' && 'toJSON' in obj && typeof obj.toJSON === 'function';
  };

  // Convertir documento Mongoose a objeto plano si es necesario
  let userObj: Record<string, unknown> = {};
  if (hasToObject(user)) {
    userObj = user.toObject();
  } else if (hasToJSON(user)) {
    userObj = user.toJSON();
  } else if (user && typeof user === 'object') {
    userObj = user as Record<string, unknown>;
  }

  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (userObj._id) {
    const id = userObj._id;
    if (typeof id === 'object' && id !== null && 'toString' in id && typeof id.toString === 'function') {
      _id = id.toString();
    } else {
      _id = String(id);
    }
  }

  return {
    _id,
    name: typeof userObj.name === 'string' ? userObj.name : '',
    email: typeof userObj.email === 'string' ? userObj.email : '',
    role: userObj.role === UserRole.ADMIN || userObj.role === UserRole.USER ? userObj.role : UserRole.USER,
    lang: typeof userObj.lang === 'string' ? userObj.lang : 'es',
    theme: typeof userObj.theme === 'string' ? userObj.theme : 'dark',
    avatar: typeof userObj.avatar === 'string' || userObj.avatar === null ? userObj.avatar : null,
    isDeleted: typeof userObj.isDeleted === 'boolean' ? userObj.isDeleted : false,
    isActive: typeof userObj.isActive === 'boolean' ? userObj.isActive : true,
    createdAt: userObj.createdAt instanceof Date ? userObj.createdAt : new Date(),
    updatedAt: userObj.updatedAt instanceof Date ? userObj.updatedAt : new Date()
  };
};