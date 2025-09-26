import { BaseRepository } from '@core/base/BaseRepository';
import { IMediaTag, MediaTagModel } from './MediaTagModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad MediaTag heredando de BaseRepository
 */
export class MediaTagRepository extends BaseRepository<IMediaTag> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(MediaTagModel, activity, loggerService);
  }
} 