import { BaseRepository } from '@core/base/BaseRepository';
import { ILibrary, LibraryModel } from './LibraryModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Library heredando de BaseRepository
 */
export class LibraryRepository extends BaseRepository<ILibrary> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(LibraryModel, activity, loggerService);
  }
}