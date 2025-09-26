import { BaseRepository } from '@core/base/BaseRepository';
import { IMediaTag, MediaTagModel } from './MediaTagModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad MediaTag heredando de BaseRepository
 */
export class MediaTagRepository extends BaseRepository<IMediaTag> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(MediaTagModel, context, loggerService);
  }
} 