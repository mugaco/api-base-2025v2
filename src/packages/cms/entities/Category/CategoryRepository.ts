/**
 * Repositorio para Category
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { ICategory, CategoryModel } from './CategoryModel';
import { RequestContext } from '@core/RequestContext';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Category heredando de BaseRepository
 */
export class CategoryRepository extends BaseRepository<ICategory> {
  constructor(context: RequestContext, loggerService: ILoggerService) {
    super(CategoryModel, context, loggerService);

    // Definir filtros permanentes específicos para esta entidad si es necesario
    // Por ejemplo:
    // this.permanentFilters = { isActive: true };
  }

  // Aquí puedes añadir métodos específicos del repositorio si son necesarios
  // Por ejemplo:

  /**
   * Busca categories por un campo específico
   */
  // async findByFieldName(fieldValue: string): Promise<ICategory[]> {
  //   return this.findAll({ fieldName: fieldValue });
  // }

  /**
   * Obtiene estadísticas de categories
   */
  // async getStatistics(): Promise<any> {
  //   return this.model.aggregate([
  //     { $match: this.applyPermanentFilters({ isDeleted: false }) },
  //     { $group: { _id: null, total: { $sum: 1 } } }
  //   ]);
  // }
} 