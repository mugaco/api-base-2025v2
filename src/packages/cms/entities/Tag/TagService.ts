/**
 * Servicio para Tag
 */
import { BaseService } from '@core/base/BaseService';
import { TagRepository } from './TagRepository';
import { ITag } from './TagModel';
import { ICreateTag, IUpdateTag, ITagResponse } from './TagSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad Tag heredando de BaseService
 */
export class TagService extends BaseService<ITag, ITagResponse, ICreateTag, IUpdateTag> {
  constructor(tagRepository: TagRepository) {
    super(tagRepository);
  }

  // Aquí puedes sobrescribir métodos de BaseService si necesitas
  // comportamiento específico para Tag. Por ejemplo:

  // async create(data: ICreateTag): Promise<ITagResponse> {
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
  ): Promise<IPaginatedResponse<ITagResponse>> {
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