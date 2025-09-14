import { BaseService } from '@core/base/BaseService';
import { IAccess } from './AccessModel';
import { AccessRepository } from './AccessRepository';
import {
  IAccess as IAccessBase,
  accessToResponse
} from './AccessSchema';
import { FilterQuery } from '@core/base/interfaces/service.interface';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

// Tipos para operaciones de Access
type ICreateAccess = Partial<IAccessBase>;
type IUpdateAccess = Partial<IAccessBase>;

/**
 * Servicio para la entidad Access heredando de BaseService
 * Mantiene solo operaciones CRUD puras sobre Access
 */
export class AccessService extends BaseService<IAccess, IAccessBase, ICreateAccess, IUpdateAccess> {
  constructor(accessRepository: AccessRepository) {
    super(accessRepository);
  }

  /**
   * Sobrescribe getAll para aplicar transformación
   */
  async getAll(query?: FilterQuery): Promise<IAccessBase[]> {
    const accesses = await super.getAll(query);
    return accesses.map(access => accessToResponse(access as unknown as IAccess));
  }

  /**
   * Sobrescribe getById para aplicar transformación
   */
  async getById(_id: string): Promise<IAccessBase> {
    const access = await super.getById(_id);
    return accessToResponse(access as unknown as IAccess);
  }

  /**
   * Sobrescribe findOne para aplicar transformación
   */
  async findOne(query: FilterQuery): Promise<IAccessBase | null> {
    const access = await super.findOne(query);
    return access ? accessToResponse(access as unknown as IAccess) : null;
  }

  /**
   * Sobrescribe create para aplicar transformación
   */
  async create(data: ICreateAccess): Promise<IAccessBase> {
    const newAccess = await super.create(data);
    return accessToResponse(newAccess as unknown as IAccess);
  }

  /**
   * Sobrescribe update para aplicar transformación
   */
  async update(_id: string, data: IUpdateAccess): Promise<IAccessBase> {
    const updatedAccess = await super.update(_id, data);
    return accessToResponse(updatedAccess as unknown as IAccess);
  }

  /**
   * Sobrescribe softDelete para aplicar transformación
   */
  async softDelete(_id: string): Promise<IAccessBase> {
    const access = await super.softDelete(_id);
    return accessToResponse(access as unknown as IAccess);
  }

  /**
   * Sobrescribe getPaginated para aplicar transformación
   */
  async getPaginated(
    query: FilterQuery,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<IAccessBase>> {
    const paginatedResult = await super.getPaginated(query, paginationParams, options);
    return {
      ...paginatedResult,
      data: paginatedResult.data.map((access) => accessToResponse(access as unknown as IAccess))
    };
  }

  /**
   * Sobrescribe getPaginatedWithFilters para aplicar transformación
   */
  async getPaginatedWithFilters(
    filter: FilterQuery = {},
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<IAccessBase>> {
    const paginatedResult = await super.getPaginatedWithFilters(
      filter,
      paginationParams,
      options,
      advancedFilters
    );
    
    return {
      ...paginatedResult,
      data: paginatedResult.data.map((access) => accessToResponse(access as unknown as IAccess))
    };
  }

  /**
   * Buscar acceso por refresh token ID
   */
  async findByRefreshTokenId(refreshTokenId: string): Promise<IAccess | null> {
    const repository = this.repository as AccessRepository;
    return await repository.findByRefreshTokenId(refreshTokenId);
  }

  /**
   * Revocar acceso por refresh token ID
   */
  async revokeByRefreshTokenId(refreshTokenId: string): Promise<void> {
    const repository = this.repository as AccessRepository;
    await repository.revokeByRefreshTokenId(refreshTokenId);
  }

  /**
   * Revocar todos los accesos de un usuario
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const repository = this.repository as AccessRepository;
    await repository.revokeAllForUser(userId);
  }

  /**
   * Crear token de recuperación
   */
  async createRecoveryToken(
    userId: string, 
    recoveryToken: string, 
    expiresAt: Date, 
    redirectUrl: string
  ): Promise<IAccess> {
    const repository = this.repository as AccessRepository;
    return await repository.createRecoveryToken(userId, recoveryToken, expiresAt, redirectUrl);
  }

  /**
   * Buscar acceso por token de recuperación
   */
  async findByRecoveryToken(recoveryToken: string): Promise<IAccess | null> {
    const repository = this.repository as AccessRepository;
    return await repository.findByRecoveryToken(recoveryToken);
  }

  /**
   * Marcar token de recuperación como usado
   */
  async markRecoveryTokenAsUsed(recoveryToken: string): Promise<void> {
    const repository = this.repository as AccessRepository;
    await repository.markRecoveryTokenAsUsed(recoveryToken);
  }
} 