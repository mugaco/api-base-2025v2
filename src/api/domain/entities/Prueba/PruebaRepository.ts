/**
 * Repositorio para Prueba
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { IPrueba, PruebaModel } from './PruebaModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Prueba heredando de BaseRepository
 */
export class PruebaRepository extends BaseRepository<IPrueba> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(PruebaModel, activity, loggerService);
    
    // Definir filtros permanentes específicos para esta entidad si es necesario
    // Por ejemplo:
    // this.permanentFilters = { isActive: true };
  }

  // Aquí puedes añadir métodos específicos del repositorio si son necesarios
  // Por ejemplo:
  
  /**
   * Busca pruebas por un campo específico
   */
  // async findByFieldName(fieldValue: string): Promise<IPrueba[]> {
  //   return this.findAll({ fieldName: fieldValue });
  // }
  
  /**
   * Obtiene estadísticas de pruebas
   */
  // async getStatistics(): Promise<any> {
  //   return this.model.aggregate([
  //     { $match: this.applyPermanentFilters({ isDeleted: false }) },
  //     { $group: { _id: null, total: { $sum: 1 } } }
  //   ]);
  // }
}