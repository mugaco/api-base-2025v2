import { BaseService } from '@core/base/BaseService';
import { MediaTagRepository } from './MediaTagRepository';
import { IMediaTag } from './MediaTagModel';
import { ICreateMediaTag, IUpdateMediaTag } from './MediaTagSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad MediaTag heredando de BaseService
 */
export class MediaTagService extends BaseService<IMediaTag, IMediaTag, ICreateMediaTag, IUpdateMediaTag> {
  constructor(mediaTagRepository: MediaTagRepository) {
    super(mediaTagRepository);
  }

  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<IMediaTag>> {
    // Extraer parámetros de paginación
    const { page = 1, itemsPerPage = 10 } = paginationParams;
    
    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };
    
    // Usar el método findPaginated del BaseService
    return this.findPaginated(query, { page, itemsPerPage }, options);
  }
} 