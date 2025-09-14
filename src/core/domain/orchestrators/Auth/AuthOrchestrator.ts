import { v4 as uuidv4 } from 'uuid';
import { TokenService } from '../../../services/TokenService';
import { EmailService } from '../../../services/EmailService';
import { EventService } from '../../../services/EventService/event.service';
import { useUnauthorizedError, useNotFoundError, useBadRequestError } from '../../../hooks/useError';

// Importaciones desde los barrels
import {
  AccessService,
  IAuthTokenPayload,
  IRefreshToken,
  IForgotPassword,
  IForgotPasswordResponse,
  IResetPassword,
  IResetPasswordResponse,
  IAuthResponse
} from '../../entities/Access';

import {
  UserService,
  IUserModel
} from '../../entities/User';

/**
 * Orquestador para operaciones de autenticación
 * Coordina operaciones entre AccessService y UserService
 */
export class AuthOrchestrator {
  private tokenService: TokenService;
  private emailService: EmailService;
  private eventService: EventService;
  
  constructor(
    private accessService: AccessService,
    private userService: UserService,
    emailService?: EmailService,
    eventService?: EventService
  ) {
    this.tokenService = new TokenService();
    this.emailService = emailService || new EmailService();
    this.eventService = eventService || {} as EventService;
  }

  /**
   * Autenticar usuario con email y contraseña
   */
  async login(email: string, password: string, headers: { ip_address?: string; origin?: string; agent?: string }): Promise<IAuthResponse> {
    // Buscar usuario por email con contraseña incluida
    const user = await this.userService.findOneWithPassword({ email });
    
    if (!user) {
      throw useUnauthorizedError('Credenciales incorrectas');
    }
    
    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw useUnauthorizedError('Credenciales incorrectas');
    }
    
    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw useUnauthorizedError('Usuario inactivo');
    }
    
    // Generar tokens
    const { token, refreshToken } = await this.generateTokens(user, headers);
    
    return {
      user,
      token,
      refreshToken
    };
  }

  /**
   * Refrescar token de autenticación
   */
  async refresh(refreshData: IRefreshToken): Promise<IAuthResponse> {
    try {
      // Verificar el refresh token
      const refreshTokenId = await this.tokenService.getRefreshTokenId(refreshData.refreshToken);
      
      // Buscar el acceso correspondiente
      const access = await this.accessService.findByRefreshTokenId(refreshTokenId);
      
      if (!access) {
        throw useUnauthorizedError('Token de refresco inválido');
      }
      
      if (access.is_revoked) {
        throw useUnauthorizedError('Token de refresco revocado');
      }
      
      // Verificar que no haya expirado
      if (access.expiresAt < new Date()) {
        throw useUnauthorizedError('Token de refresco expirado');
      }
      
      // Verificar que los metadatos coincidan (seguridad adicional)
      if (refreshData.agent && refreshData.agent !== access.agent) {
        throw useUnauthorizedError('Metadatos de sesión no coinciden');
      }
      
      if (refreshData.origin && refreshData.origin !== access.origin) {
        throw useUnauthorizedError('Metadatos de sesión no coinciden');
      }
      
      // Buscar el usuario
      const user = await this.userService.findByIdRaw(access.user_id.toString());
      
      if (!user) {
        throw useUnauthorizedError('Usuario no encontrado');
      }
      
      if (!user.isActive) {
        throw useUnauthorizedError('Usuario inactivo');
      }
      
      // Revocar el token anterior
      await this.accessService.revokeByRefreshTokenId(refreshTokenId);
      
      // Generar nuevos tokens
      const { token, refreshToken } = await this.generateTokens(user, refreshData);
      
      return {
        user,
        token,
        refreshToken
      };
    } catch {
      throw useUnauthorizedError('Error al refrescar el token');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      const refreshTokenId = await this.tokenService.getRefreshTokenId(refreshToken);
      await this.accessService.revokeByRefreshTokenId(refreshTokenId);
      return true;
    } catch {
      throw useUnauthorizedError('Token de refresco inválido');
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  async logoutAll(userId: string): Promise<boolean> {
    await this.accessService.revokeAllForUser(userId);
    return true;
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(data: IForgotPassword): Promise<IForgotPasswordResponse> {
    try {
      // Buscar usuario por email
      const user = await this.userService.findOneRaw({ email: data.email });
      
      if (!user) {
        // Por seguridad, no revelar si el email existe o no
        return {
          success: true,
          message: 'Si el correo existe, se ha enviado un enlace de recuperación'
        };
      }
      
      if (!user.isActive) {
        return {
          success: false,
          message: 'No se pudo procesar la solicitud. Contacte al administrador.'
        };
      }
      
      // Generar token único para recuperación (usando uuid)
      const recoveryToken = uuidv4();
      
      // Fecha de expiración (24 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Guardar token en base de datos
      await this.accessService.createRecoveryToken(
        user._id ? user._id.toString() : '',
        recoveryToken,
        expiresAt,
        data.redirect_url!
      );
      
      // Construir URL de recuperación
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000/api';
      const resetUrl = `https://${baseUrl}/access/reset-password/${recoveryToken}`;
      
      // Enviar email de recuperación
      if (process.env.NODE_ENV !== 'test') {
        const userName = user.name || 'Usuario';
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperación de contraseña</h2>
            <p>Hola ${userName},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <p><a href="${resetUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Restablecer contraseña</a></p>
            <p style="font-size: 14px; color: #666;">Este enlace es válido por 24 horas.</p>
            <p>Si no solicitaste este cambio, ignora este mensaje.</p>
            <p>Saludos,<br>El equipo de soporte</p>
          </div>
        `;
        
        const textContent = 
          `Recuperación de contraseña\n\n` +
          `Hola ${userName},\n\n` +
          `Has solicitado restablecer tu contraseña. Visita el siguiente enlace para continuar:\n\n` +
          `${resetUrl}\n\n` +
          `Este enlace es válido por 24 horas.\n\n` +
          `Si no solicitaste este cambio, ignora este mensaje.\n\n` +
          `Saludos,\nEl equipo de soporte`;
          
        await this.emailService.sendEmail({
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          to: user.email,
          subject: 'Recuperación de contraseña',
          html: htmlContent,
          text: textContent
        });
      }
      
      // Emitir evento (opcional)
      try {
        if (this.eventService && this.eventService.emit) {
          this.eventService.emit('password:recovery-requested', {
            userId: user._id ? user._id.toString() : '',
            email: user.email,
            timestamp: new Date()
          });
        }
      } catch {
        // Error al emitir evento password:recovery-requested - no interrumpir el flujo
      }
      
      return {
        success: true,
        message: 'Si el correo existe, se ha enviado un enlace de recuperación'
      };
    } catch {
      throw useBadRequestError('Error al procesar solicitud de recuperación');
    }
  }

  /**
   * Verificar token de recuperación
   */
  async verifyRecoveryToken(token: string): Promise<string> {
    // Buscar token de recuperación
    const access = await this.accessService.findByRecoveryToken(token);
    
    if (!access) {
      throw useUnauthorizedError('Token de recuperación inválido o expirado');
    }
    
    if (!access.recovery_redirect_url) {
      throw useUnauthorizedError('URL de redirección no configurada');
    }
    
    // Buscar usuario para asegurar que esté activo
    const user = await this.userService.findByIdRaw(access.user_id.toString());
    
    if (!user || !user.isActive) {
      throw useUnauthorizedError('Usuario no válido o inactivo');
    }
    
    // Construir URL con token para frontend
    const redirectUrl = access.recovery_redirect_url;
    return `${redirectUrl}?token=${token}`;
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(data: IResetPassword): Promise<IResetPasswordResponse> {
    try {
      // Buscar token de recuperación
      const access = await this.accessService.findByRecoveryToken(data.token);
      
      if (!access) {
        throw useUnauthorizedError('Token de recuperación inválido o expirado');
      }
      
      // Buscar usuario
      const user = await this.userService.findByIdRaw(access.user_id.toString());
      
      if (!user) {
        throw useNotFoundError('Usuario no encontrado');
      }
      
      if (!user.isActive) {
        throw useUnauthorizedError('Usuario inactivo');
      }
      
      // Actualizar contraseña del usuario (hasheamos manualmente porque update() no activa pre('save'))
      const bcrypt = await import('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      
      await this.userService.update(user._id ? user._id.toString() : '', { 
        password: hashedPassword 
      });
      
      // Marcar token como usado
      await this.accessService.markRecoveryTokenAsUsed(data.token);
      
      // Revocar todas las sesiones existentes por seguridad
      await this.accessService.revokeAllForUser(user._id ? user._id.toString() : '');
      
      // Emitir evento (opcional)
      try {
        if (this.eventService && this.eventService.emit) {
          this.eventService.emit('password:reset-completed', {
            userId: user._id ? user._id.toString() : '',
            email: user.email,
            timestamp: new Date()
          });
        }
      } catch {
        // Error al emitir evento password:reset-completed - no interrumpir el flujo
      }
      
      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw useBadRequestError(error.message);
      }
      throw useBadRequestError('Error al restablecer contraseña');
    }
  }

  /**
   * Generar tokens de autenticación
   */
  private async generateTokens(user: IUserModel, headers: { ip_address?: string; origin?: string; agent?: string }): Promise<{ token: string, refreshToken: string }> {
    try {
      // Crear payload para JWT
      const payload: IAuthTokenPayload = {
        _id: user._id ? user._id.toString() : '',
        email: user.email,
        username: user.name,
        role: user.role
      };
      
      // Generar token JWT
      const token = await this.tokenService.generateToken(payload);
      
      // Generar refresh token único
      const refreshTokenId = uuidv4();
      const refreshToken = await this.tokenService.generateRefreshToken(refreshTokenId);
      
      // Calcular fecha de expiración del refresh token (30 días)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Guardar token en base de datos
      await this.accessService.create({
        user_id: user._id ? user._id.toString() : '',
        ip_address: headers.ip_address || '',
        origin: headers.origin || '',
        agent: headers.agent || '',
        refreshtoken_id: refreshTokenId,
        is_revoked: false,
        expiresAt
      });
      
      return { token, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al generar tokens: ${error.message}`);
      }
      throw new Error('Error al generar tokens');
    }
  }
}