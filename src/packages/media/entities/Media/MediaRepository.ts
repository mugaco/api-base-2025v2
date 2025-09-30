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

  /**
   * Método para obtener múltiples medios según filtros
   * @param query - Filtros de búsqueda
   * @returns Lista de medios que coinciden con los filtros
   */
  async findMedias(query: Record<string, unknown>): Promise<IMedia[]> {
    return this.model.find({ ...query, isDeleted: false }).exec();
  }
} 