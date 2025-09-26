import { BaseRepository } from '@core/base/BaseRepository';
import { IMedia, MediaModel } from './MediaModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Media heredando de BaseRepository
 */
export class MediaRepository extends BaseRepository<IMedia> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(MediaModel, activity, loggerService);
  }
} 