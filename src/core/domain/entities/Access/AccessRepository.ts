import { FilterQuery } from 'mongoose';
import { BaseRepository } from '@core/base/BaseRepository';
import { IAccess, AccessModel } from './AccessModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Access heredando de BaseRepository
 */
export class AccessRepository extends BaseRepository<IAccess> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(AccessModel, activity, loggerService);

    // Definir filtros permanentes específicos para esta entidad si es necesario
    // this.permanentFilters = {};
  }

  // Métodos específicos del repositorio de Access
  async findByRefreshTokenId(refreshTokenId: string): Promise<IAccess | null> {
    return this.findOne({ refreshtoken_id: refreshTokenId } as FilterQuery<IAccess>);
  }

  async revokeByRefreshTokenId(refreshTokenId: string): Promise<IAccess | null> {
    return this.model.findOneAndUpdate(
      { refreshtoken_id: refreshTokenId } as FilterQuery<IAccess>,
      { is_revoked: true },
      { new: true }
    ).exec();
  }

  async revokeAllForUser(userId: string): Promise<boolean> {
    const result = await this.model.updateMany(
      { user_id: userId, is_revoked: false } as FilterQuery<IAccess>,
      { is_revoked: true }
    ).exec();

    return result.modifiedCount > 0;
  }

  // Métodos para recuperación de contraseña
  async createRecoveryToken(userId: string, token: string, expiresAt: Date, redirectUrl: string): Promise<IAccess> {
    // Invalidar tokens de recuperación anteriores para este usuario
    await this.model.updateMany(
      {
        user_id: userId,
        recovery_token: { $ne: null },
        recovery_used: false
      } as FilterQuery<IAccess>,
      { recovery_used: true }
    ).exec();

    // Crear nuevo token de recuperación
    return this.create({
      user_id: userId,
      refreshtoken_id: `recovery_${token.substring(0, 8)}`,
      recovery_token: token,
      recovery_expires: expiresAt,
      recovery_redirect_url: redirectUrl,
      recovery_used: false,
      is_revoked: false,
      expiresAt,
      ip_address: 'recovery-process',
      origin: 'recovery-process',
      agent: 'recovery-process'
    });
  }

  async findByRecoveryToken(token: string): Promise<IAccess | null> {
    return this.findOne({
      recovery_token: token,
      recovery_used: false,
      recovery_expires: { $gt: new Date() }
    } as FilterQuery<IAccess>);
  }

  async markRecoveryTokenAsUsed(token: string): Promise<IAccess | null> {
    return this.model.findOneAndUpdate(
      { recovery_token: token } as FilterQuery<IAccess>,
      { recovery_used: true },
      { new: true }
    ).exec();
  }

  async invalidateAllRecoveryTokensForUser(userId: string): Promise<boolean> {
    const result = await this.model.updateMany(
      {
        user_id: userId,
        recovery_token: { $ne: null },
        recovery_used: false
      } as FilterQuery<IAccess>,
      { recovery_used: true }
    ).exec();

    return result.modifiedCount > 0;
  }

} 