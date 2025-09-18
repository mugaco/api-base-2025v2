import { BaseService } from '@core/base/BaseService';
import { LibraryRepository } from './LibraryRepository';
import { ILibrary } from './LibraryModel';
import { ICreateLibrary, IUpdateLibrary } from './LibrarySchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad Library heredando de BaseService
 */
export class LibraryService extends BaseService<ILibrary, ILibrary, ICreateLibrary, IUpdateLibrary> {
  constructor(libraryRepository: LibraryRepository) {
    super(libraryRepository);
  }

  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<ILibrary>> {
    // Extraer parámetros de paginación
    const { page = 1, itemsPerPage = 10 } = paginationParams;
    
    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        // Ajusta los campos según tu modelo
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };
    
    // Usar el método getPaginated del BaseService
    return this.getPaginated(query, { page, itemsPerPage }, options);
  }
}