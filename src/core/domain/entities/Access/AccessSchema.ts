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
  userId: z.string().min(1, 'El ID de usuario es obligatorio')
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
export const accessToResponse = (access: any) => {
  // Convertir documento Mongoose a objeto plano si es necesario
  const accessObj = access && typeof access.toObject === 'function' 
    ? access.toObject() 
    : (access && typeof access.toJSON === 'function' ? access.toJSON() : access);
  
  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (accessObj?._id) {
    _id = typeof accessObj._id.toString === 'function' 
      ? accessObj._id.toString() 
      : String(accessObj._id);
  }
  
  // Asegurar que user_id sea string
  let user_id = '';
  if (accessObj?.user_id) {
    user_id = typeof accessObj.user_id.toString === 'function' 
      ? accessObj.user_id.toString() 
      : String(accessObj.user_id);
  }
  
  return {
    _id,
    user_id,
    ip_address: accessObj?.ip_address || '',
    origin: accessObj?.origin || '',
    agent: accessObj?.agent || '',
    refreshtoken_id: accessObj?.refreshtoken_id || '',
    is_revoked: typeof accessObj?.is_revoked === 'boolean' ? accessObj.is_revoked : false,
    expiresAt: accessObj?.expiresAt || new Date(),
    createdAt: accessObj?.createdAt || new Date(),
    updatedAt: accessObj?.updatedAt || new Date(),
    recovery_token: accessObj?.recovery_token || null,
    recovery_expires: accessObj?.recovery_expires || null,
    recovery_redirect_url: accessObj?.recovery_redirect_url || null,
    recovery_used: typeof accessObj?.recovery_used === 'boolean' ? accessObj.recovery_used : false
  };
}; 