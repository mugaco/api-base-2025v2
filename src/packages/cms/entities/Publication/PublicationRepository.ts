/**
 * Repositorio para Publication
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { IPublication, PublicationModel } from './PublicationModel';

/**
 * Repositorio para la entidad Publication heredando de BaseRepository
 */
export class PublicationRepository extends BaseRepository<IPublication> {
  constructor() {
    super(PublicationModel);

    // Definir filtros permanentes específicos para esta entidad si es necesario
    // Por ejemplo:
    // this.permanentFilters = { isActive: true };
  }


  // Aquí puedes añadir métodos específicos del repositorio si son necesarios
  // Por ejemplo:

  /**
   * Busca publications por un campo específico
   */
  // async findByFieldName(fieldValue: string): Promise<IPublication[]> {
  //   return this.findAll({ fieldName: fieldValue });
  // }

  /**
   * Obtiene estadísticas de publications
   */
  // async getStatistics(): Promise<any> {
  //   return this.model.aggregate([
  //     { $match: this.applyPermanentFilters({ isDeleted: false }) },
  //     { $group: { _id: null, total: { $sum: 1 } } }
  //   ]);
  // }
} 