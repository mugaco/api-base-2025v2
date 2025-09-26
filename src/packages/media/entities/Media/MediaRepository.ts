import { BaseRepository } from '@core/base/BaseRepository';
import { IMedia, MediaModel } from './MediaModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Media heredando de BaseRepository
 */
export class MediaRepository extends BaseRepository<IMedia> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(MediaModel, context, loggerService);
  }
} 