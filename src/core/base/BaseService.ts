import { Document, FilterQuery, ClientSession } from 'mongoose';
import { IExtendedRepository } from '@core/base/interfaces/repository.interface';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IService } from '@core/base/interfaces/service.interface';
import { useNotFoundError } from '@core/hooks/useError';

/**
 * Clase base abstracta para servicios
 * Proporciona operaciones comunes utilizando herencia
 */
export abstract class BaseService<
  TDocument extends Document,
  TResponse = TDocument,
  TCreateDTO = Partial<TDocument>,
  TUpdateDTO = Partial<TDocument>
> implements IService<TResponse, TCreateDTO, TUpdateDTO> {

  protected repository: IExtendedRepository<TDocument>;

  constructor(repository: IExtendedRepository<TDocument>) {
    this.repository = repository;
  }

  /**
   * Obtiene elementos de forma paginada
   * @param filter - Filtro base => simpleSearch
   * @param paginationParams - Parámetros de paginación
   * @param options - Opciones de consulta (ordenación, proyección)
   * @param advancedFilters - Filtros avanzados en formato JSON string
   * @param permanentContextFilters - Filtros contextuales adicionales que siempre se aplican (string JSON o null)
   */
  async findPaginated(
    filter: FilterQuery<TDocument>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string,
    permanentContextFilters?: string | null
  ): Promise<IPaginatedResponse<TResponse>> {

    const result = await this.repository.findPaginated(
      filter,
      paginationParams,
      options,
      advancedFilters,
      permanentContextFilters
    );

    return {
      ...result,
      data: result.data as unknown as TResponse[]
    };
  }

  /**
   * Obtiene un elemento por su ID
   */
  async findById(_id: string): Promise<TResponse> {
    const result = await this.repository.findById(_id);
    if (!result) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Busca un elemento que coincida con el filtro
   * Aplica automáticamente el filtro isDeleted: false
   */
  async findOne(filter: FilterQuery<TDocument>): Promise<TResponse | null> {
    // El Repository ya aplica el filtro isDeleted automáticamente
    const result = await this.repository.findOne(filter);
    return result as unknown as TResponse | null;
  }

  /**
   * Crea un nuevo elemento
   */
  async create(data: TCreateDTO, options?: { session?: ClientSession }): Promise<TResponse> {
    const result = await this.repository.create(data as unknown as Partial<TDocument>, options);
    return result as unknown as TResponse;
  }

  /**
   * Actualiza un elemento existente
   */
  async update(_id: string, data: TUpdateDTO, options?: { session?: ClientSession }): Promise<TResponse> {
    const result = await this.repository.update(_id, data as unknown as Partial<TDocument>, options);
    if (!result) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Elimina un elemento
   */
  async delete(_id: string, options?: { session?: ClientSession }): Promise<boolean> {
    return this.repository.delete(_id, options);
  }

  /**
   * Realiza un borrado lógico del elemento
   */
  async softDelete(_id: string, options?: { session?: ClientSession }): Promise<TResponse> {
    const result = await this.repository.softDelete(_id, options);
    if (!result) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Restaura un elemento eliminado lógicamente
   * Nota: Este método requiere que el repositorio tenga implementado el método restore
   */
  async restore(_id: string, options?: { session?: ClientSession }): Promise<TResponse> {
    if (!this.repository.restore) {
      throw new Error('Restore operation is not supported by this repository');
    }
    const result = await this.repository.restore(_id, options);
    if (!result) {
      throw useNotFoundError(`Resource with _id ${_id} not found or could not be restored`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Cuenta elementos que coinciden con el filtro
   * Aplica automáticamente el filtro isDeleted: false
   */
  async count(filter?: FilterQuery<TDocument>): Promise<number> {
    // El Repository ya aplica el filtro isDeleted automáticamente
    return this.repository.count(filter || {});
  }


}