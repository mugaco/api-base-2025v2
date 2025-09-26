import { BaseRepository } from '@core/base/BaseRepository';
import { ILibraryTag, LibraryTagModel } from './LibraryTagModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad LibraryTag heredando de BaseRepository
 */
export class LibraryTagRepository extends BaseRepository<ILibraryTag> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(LibraryTagModel, activity, loggerService);
  }
} 