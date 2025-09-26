import { FilterQuery } from 'mongoose';
import { BaseRepository } from '@core/base/BaseRepository';
import { IUserModel, UserModel } from './UserModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad User heredando de BaseRepository
 */
export class UserRepository extends BaseRepository<IUserModel> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(UserModel, activity, loggerService);

    // Definir filtros permanentes específicos para esta entidad
    this.permanentFilters = {
      isActive: true
    };
  }

  // Métodos específicos del repositorio de usuarios
  async findByEmail(email: string): Promise<IUserModel | null> {
    return this.findOne({ email } as FilterQuery<IUserModel>);
  }

  async findByName(name: string): Promise<IUserModel | null> {
    return this.findOne({ name } as FilterQuery<IUserModel>);
  }

  async findByIdWithPassword(_id: string): Promise<IUserModel | null> {
    return this.model.findOne({
      ...this.applyPermanentFilters({}),
      _id
    }).select('+password').exec();
  }

  async findOneWithPassword(filter: FilterQuery<IUserModel>): Promise<IUserModel | null> {
    return this.model.findOne(
      this.applyPermanentFilters(filter)
    ).select('+password').exec();
  }
} 