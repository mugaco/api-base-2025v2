import { z } from 'zod';

// Enums para Access
export enum AccessTokenType {
  AUTH = 'auth',
  REFRESH = 'refresh',
  RECOVERY = 'recovery'
}

// Esquema para los headers de acceso
export const AccessHeadersSchema = z.object({
  ip_address: z.string().optional(),
  origin: z.string().optional(),
  agent: z.string().optional()
});

// Esquema base para Access
export const AccessBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  user_id: z.any(), // Puede ser string u ObjectId
  ip_address: z.string().optional(),
  origin: z.string().optional(),
  agent: z.string().optional(),
  refreshtoken_id: z.string(),
  isDeleted: z.boolean().default(false),
  is_revoked: z.boolean().default(false),
  expiresAt: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  // Campos para recuperación de contraseña
  recovery_token: z.string().optional().nullable(),
  recovery_expires: z.date().optional().nullable(),
  recovery_redirect_url: z.string().optional().nullable(),
  recovery_used: z.boolean().optional().default(false)
});

// Tipo base para Access
export type IAccess = z.infer<typeof AccessBaseSchema>;

// Esquema para login
export const LoginSchema = z.object({
  email: z.string().email('El formato del email es inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
}).strict();

export type ILogin = z.infer<typeof LoginSchema>;

// Esquema para refresh token
export const RefreshTokenSchema = AccessHeadersSchema.extend({
  refreshToken: z.string().min(1, 'El token de refresco es obligatorio')
});

export type IRefreshToken = z.infer<typeof RefreshTokenSchema>;

// Esquema para logout
export const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'El token de refresco es obligatorio')
});

export type ILogout = z.infer<typeof LogoutSchema>;

// Esquema para logout all
export const LogoutAllSchema = z.object({
  user_id: z.string().min(1, 'El ID de usuario es obligatorio')
});

export type ILogoutAll = z.infer<typeof LogoutAllSchema>;

// Esquema para forgot password
export const ForgotPasswordSchema = z.object({
  email: z.string().email('El formato del email es inválido'),
  redirect_url: z.string()
    .url('La URL de redirección debe ser un URL válido')
    .min(1, 'La URL de redirección es obligatoria')
});

export type IForgotPassword = z.infer<typeof ForgotPasswordSchema>;

// Esquema para verificar token de recuperación
export const VerifyRecoveryTokenSchema = z.object({
  token: z.string().min(1, 'El token es obligatorio')
});

export type IVerifyRecoveryToken = z.infer<typeof VerifyRecoveryTokenSchema>;

// Esquema para reset password
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es obligatorio'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  password_confirm: z.string()
    .min(1, 'La confirmación de contraseña es obligatoria')
}).refine(data => data.password === data.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm']
});

export type IResetPassword = z.infer<typeof ResetPasswordSchema>;

// Esquema para token payload 
export const AuthTokenPayloadSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: z.string()
});

export type IAuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

// Esquema para respuesta de tokens
export const TokenResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string()
});

export type ITokenResponse = z.infer<typeof TokenResponseSchema>;

// Esquema para respuesta de autenticación
export const AuthResponseSchema = z.object({
  user: z.any(), // Se utiliza any porque puede venir cualquier objeto de usuario
  token: z.string(),
  refreshToken: z.string()
});

export type IAuthResponse = z.infer<typeof AuthResponseSchema>;

// Esquema para respuesta de recuperación de contraseña
export const ForgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type IForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

// Esquema para respuesta de reset de contraseña
export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type IResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

// Función de conversión para mapear Access a un tipo de respuesta (similar a userToResponse)
export const accessToResponse = (access: unknown): IAccess => {
  // Type guard para verificar si el objeto tiene métodos de Mongoose
  const hasToObject = (obj: unknown): obj is { toObject: () => Record<string, unknown> } => {
    return obj !== null && typeof obj === 'object' && 'toObject' in obj && typeof obj.toObject === 'function';
  };

  const hasToJSON = (obj: unknown): obj is { toJSON: () => Record<string, unknown> } => {
    return obj !== null && typeof obj === 'object' && 'toJSON' in obj && typeof obj.toJSON === 'function';
  };

  // Convertir documento Mongoose a objeto plano si es necesario
  let accessObj: Record<string, unknown> = {};
  if (hasToObject(access)) {
    accessObj = access.toObject();
  } else if (hasToJSON(access)) {
    accessObj = access.toJSON();
  } else if (access && typeof access === 'object') {
    accessObj = access as Record<string, unknown>;
  }
  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (accessObj._id) {
    const id = accessObj._id;
    if (typeof id === 'object' && id !== null && 'toString' in id && typeof id.toString === 'function') {
      _id = id.toString();
    } else {
      _id = String(id);
    }
  }

  // Asegurar que user_id sea string
  let user_id = '';
  if (accessObj.user_id) {
    const userId = accessObj.user_id;
    if (typeof userId === 'object' && userId !== null && 'toString' in userId && typeof userId.toString === 'function') {
      user_id = userId.toString();
    } else {
      user_id = String(userId);
    }
  }

  return {
    _id,
    user_id,
    ip_address: typeof accessObj.ip_address === 'string' ? accessObj.ip_address : '',
    origin: typeof accessObj.origin === 'string' ? accessObj.origin : '',
    agent: typeof accessObj.agent === 'string' ? accessObj.agent : '',
    refreshtoken_id: typeof accessObj.refreshtoken_id === 'string' ? accessObj.refreshtoken_id : '',
    isDeleted: typeof accessObj.isDeleted === 'boolean' ? accessObj.isDeleted : false,
    is_revoked: typeof accessObj.is_revoked === 'boolean' ? accessObj.is_revoked : false,
    expiresAt: accessObj.expiresAt instanceof Date ? accessObj.expiresAt : new Date(),
    createdAt: accessObj.createdAt instanceof Date ? accessObj.createdAt : new Date(),
    updatedAt: accessObj.updatedAt instanceof Date ? accessObj.updatedAt : new Date(),
    recovery_token: typeof accessObj.recovery_token === 'string' || accessObj.recovery_token === null ? accessObj.recovery_token : null,
    recovery_expires: accessObj.recovery_expires instanceof Date || accessObj.recovery_expires === null ? accessObj.recovery_expires : null,
    recovery_redirect_url: typeof accessObj.recovery_redirect_url === 'string' || accessObj.recovery_redirect_url === null ? accessObj.recovery_redirect_url : null,
    recovery_used: typeof accessObj.recovery_used === 'boolean' ? accessObj.recovery_used : false
  };
}; 