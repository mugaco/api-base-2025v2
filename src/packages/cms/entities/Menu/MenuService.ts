/**
 * Servicio para Menu
 */
import { BaseService } from '@core/base/BaseService';
import { MenuRepository } from './MenuRepository';
import { IMenu } from './MenuModel';
import { ICreateMenu, IUpdateMenu, IMenuResponse } from './MenuSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad Menu heredando de BaseService
 */
export class MenuService extends BaseService<IMenu, IMenuResponse, ICreateMenu, IUpdateMenu> {
  constructor(menuRepository: MenuRepository) {
    super(menuRepository);
  }

  // Aquí puedes sobrescribir métodos de BaseService si necesitas
  // comportamiento específico para Menu. Por ejemplo:

  // async create(data: ICreateMenu): Promise<IMenuResponse> {
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
  ): Promise<IPaginatedResponse<IMenuResponse>> {
    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        // Ajusta los campos según tu modelo
        // { name: { $regex: searchTerm, $options: 'i' } },
        // { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Usar el método findPaginated heredado de BaseService
    const result = await this.findPaginated(query, paginationParams, options);

    return result;
  }
} 