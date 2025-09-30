import { BaseService } from '@core/base/BaseService';
import { LibraryTagRepository } from './LibraryTagRepository';
import { ILibraryTag } from './LibraryTagModel';
import { ICreateLibraryTag, IUpdateLibraryTag } from './LibraryTagSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad LibraryTag heredando de BaseService
 */
export class LibraryTagService extends BaseService<ILibraryTag, ILibraryTag, ICreateLibraryTag, IUpdateLibraryTag> {
  constructor(libraryTagRepository: LibraryTagRepository) {
    super(libraryTagRepository);
  }

  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<ILibraryTag>> {
    // Extraer parámetros de paginación
    const { page = 1, itemsPerPage = 10 } = paginationParams;
    
    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };
    
    // Usar el método findPaginated del BaseService
    return this.findPaginated(query, { page, itemsPerPage }, options);
  }
} 