/**
 * Repositorio para Product
 */
import { BaseRepository } from '@core/base/BaseRepository';
import { ProductModel, IProduct } from './ProductModel';
import { ActivityLog } from '@core/ActivityLog';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Repositorio para la entidad Product
 * Extiende BaseRepository para heredar operaciones CRUD estándar
 */
export class ProductRepository extends BaseRepository<IProduct> {
  constructor(activity: ActivityLog, loggerService: ILoggerService) {
    super(ProductModel, activity, loggerService);
  }

  // Métodos adicionales específicos del repositorio pueden añadirse aquí
  // Los métodos CRUD estándar son heredados de BaseRepository:
  // - findAll
  // - findById
  // - findOne
  // - create
  // - update
  // - delete
  // - softDelete (si está habilitado)
  // - restore (si está habilitado)
  // - countDocuments
  // - aggregate
  // - distinct
  // - exists

  /**
   * Ejemplo de método personalizado con agregación
   * Descomentar y modificar según necesidad
   */
  /*
  async getStatistics(): Promise<any> {
    return this.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          // Añadir más estadísticas según necesidad
        }
      }
    ]);
  }
  */
} 