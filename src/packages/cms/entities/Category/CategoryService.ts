/**
 * Servicio para Category
 */
import { BaseService } from '@core/base/BaseService';
import { CategoryRepository } from './CategoryRepository';
import { ICategory } from './CategoryModel';
import { ICreateCategory, IUpdateCategory, ICategoryResponse } from './CategorySchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad Category heredando de BaseService
 */
export class CategoryService extends BaseService<ICategory, ICategoryResponse, ICreateCategory, IUpdateCategory> {
  constructor(categoryRepository: CategoryRepository) {
    super(categoryRepository);
  }

  // Aquí puedes sobrescribir métodos de BaseService si necesitas
  // comportamiento específico para Category. Por ejemplo:

  // async create(data: ICreateCategory): Promise<ICategoryResponse> {
  //   // Lógica específica antes de crear
  //   // Por ejemplo, validaciones adicionales o transformación de datos
  //
  //   const result = await super.create(data);
  //
  //   // Lógica específica después de crear
  //   // Por ejemplo, enviar notificaciones o actualizar caché
  //
  //   return result;
  // }

  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<ICategoryResponse>> {
    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        // Ajusta los campos según tu modelo
        // { name: { $regex: searchTerm, $options: 'i' } },
        // { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Usar el método getPaginated heredado de BaseService
    const result = await this.getPaginated(query, paginationParams, options);

    return result;
  }
} 