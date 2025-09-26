import { BaseRepository } from '@core/base/BaseRepository';
import { ILibraryTag, LibraryTagModel } from './LibraryTagModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad LibraryTag heredando de BaseRepository
 */
export class LibraryTagRepository extends BaseRepository<ILibraryTag> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(LibraryTagModel, context, loggerService);
  }
} 