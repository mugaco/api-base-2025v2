/**
 * Repositorio para Tag
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { ITag, TagModel } from './TagModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Tag heredando de BaseRepository
 */
export class TagRepository extends BaseRepository<ITag> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(TagModel, context, loggerService);

    // Definir filtros permanentes específicos para esta entidad si es necesario
    // Por ejemplo:
    // this.permanentFilters = { isActive: true };
  }

  // Aquí puedes añadir métodos específicos del repositorio si son necesarios
  // Por ejemplo:

  /**
   * Busca tags por un campo específico
   */
  // async findByFieldName(fieldValue: string): Promise<ITag[]> {
  //   return this.findAll({ fieldName: fieldValue });
  // }

  /**
   * Obtiene estadísticas de tags
   */
  // async getStatistics(): Promise<any> {
  //   return this.model.aggregate([
  //     { $match: this.applyPermanentFilters({ isDeleted: false }) },
  //     { $group: { _id: null, total: { $sum: 1 } } }
  //   ]);
  // }
} 