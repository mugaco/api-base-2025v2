/**
 * Repositorio para Menu
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { IMenu, MenuModel } from './MenuModel';

/**
 * Repositorio para la entidad Menu heredando de BaseRepository
 */
export class MenuRepository extends BaseRepository<IMenu> {
  constructor() {
    super(MenuModel);

    // Definir filtros permanentes específicos para esta entidad si es necesario
    // Por ejemplo:
    // this.permanentFilters = { isActive: true };
  }

  // Aquí puedes añadir métodos específicos del repositorio si son necesarios
  // Por ejemplo:

  /**
   * Busca menus por un campo específico
   */
  // async findByFieldName(fieldValue: string): Promise<IMenu[]> {
  //   return this.findAll({ fieldName: fieldValue });
  // }

  /**
   * Obtiene estadísticas de menus
   */
  // async getStatistics(): Promise<any> {
  //   return this.model.aggregate([
  //     { $match: this.applyPermanentFilters({ isDeleted: false }) },
  //     { $group: { _id: null, total: { $sum: 1 } } }
  //   ]);
  // }
} 