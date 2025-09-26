import { BaseRepository } from '@core/base/BaseRepository';
import { ILibrary, LibraryModel } from './LibraryModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Library heredando de BaseRepository
 */
export class LibraryRepository extends BaseRepository<ILibrary> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(LibraryModel, context, loggerService);
  }
}