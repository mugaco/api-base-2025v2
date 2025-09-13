import { Document, FilterQuery } from 'mongoose';
import { IExtendedRepository } from '@core/bases/interfaces/repository.interface';
import { IPaginationParams } from '@core/bases/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/bases/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/bases/interfaces/QueryOptions.interface';
import { IService } from '@core/bases/interfaces/service.interface';

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
   * Obtiene todos los elementos que coinciden con el filtro
   */
  async getAll(filter?: FilterQuery<TDocument>, options?: IQueryOptions): Promise<TResponse[]> {
    // Por defecto, excluir elementos eliminados lógicamente
    const finalFilter = { ...filter, isDeleted: false };
    const items = await this.repository.findAll(finalFilter, options);
    return items as unknown as TResponse[];
  }

  /**
   * Obtiene un elemento por su ID
   */
  async getById(_id: string): Promise<TResponse> {
    const result = await this.repository.findById(_id);
    if (!result) {
      throw new Error(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Busca un elemento que coincida con el filtro
   */
  async findOne(filter: FilterQuery<TDocument>): Promise<TResponse | null> {
    const result = await this.repository.findOne(filter);
    return result as unknown as TResponse | null;
  }

  /**
   * Crea un nuevo elemento
   */
  async create(data: TCreateDTO): Promise<TResponse> {
    const result = await this.repository.create(data as unknown as Partial<TDocument>);
    return result as unknown as TResponse;
  }

  /**
   * Actualiza un elemento existente
   */
  async update(_id: string, data: TUpdateDTO): Promise<TResponse> {
    const result = await this.repository.update(_id, data as unknown as Partial<TDocument>);
    if (!result) {
      throw new Error(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Elimina un elemento
   */
  async delete(_id: string): Promise<boolean> {
    return this.repository.delete(_id);
  }

  /**
   * Realiza un borrado lógico del elemento
   */
  async softDelete(_id: string): Promise<TResponse> {
    const result = await this.repository.softDelete(_id);
    if (!result) {
      throw new Error(`Resource with _id ${_id} not found`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Restaura un elemento eliminado lógicamente
   * Nota: Este método requiere que el repositorio tenga implementado el método restore
   */
  async restore(_id: string): Promise<TResponse> {
    if (!this.repository.restore) {
      throw new Error('Restore operation is not supported by this repository');
    }
    const result = await this.repository.restore(_id);
    if (!result) {
      throw new Error(`Resource with _id ${_id} not found or could not be restored`);
    }
    return result as unknown as TResponse;
  }

  /**
   * Obtiene elementos de forma paginada
   */
  async getPaginated(
    filter: FilterQuery<TDocument>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<TResponse>> {
    // Por defecto, excluir elementos eliminados lógicamente
    const finalFilter = { ...filter, isDeleted: false };
    const result = await this.repository.findPaginated(finalFilter, paginationParams, options);
    return {
      ...result,
      data: result.data as unknown as TResponse[]
    };
  }

  /**
   * Cuenta elementos que coinciden con el filtro
   */
  async count(filter?: FilterQuery<TDocument>): Promise<number> {
    return this.repository.count(filter);
  }

  /**
   * Obtiene todos los elementos activos (no eliminados lógicamente)
   * Nota: Este método requiere que el repositorio tenga implementado el método getAllActive
   */
  async getAllActive(query: FilterQuery<TDocument> = {}): Promise<TResponse[]> {
    if (!this.repository.getAllActive) {
      // Si no existe el método, usar findAll con filtro isDeleted: false
      const items = await this.repository.findAll({ ...query, isDeleted: false } as FilterQuery<TDocument>);
      return items as unknown as TResponse[];
    }
    const items = await this.repository.getAllActive(query);
    return items as unknown as TResponse[];
  }

  /**
   * Obtiene todos los elementos con filtros avanzados
   */
  async getAllWithFilters(
    filter: FilterQuery<TDocument> = {},
    advancedFilters?: string
  ): Promise<TResponse[]> {
    const items = await this.repository.findAllWithFilters(
      filter,
      advancedFilters
    );
    return items as unknown as TResponse[];
  }

  /**
   * Obtiene elementos de forma paginada con filtros avanzados
   */
  async getPaginatedWithFilters(
    filter: FilterQuery<TDocument> = {},
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<TResponse>> {
    const paginatedResult = await this.repository.findPaginatedWithFilters(
      filter,
      paginationParams,
      options,
      advancedFilters
    );
    
    return {
      ...paginatedResult,
      data: paginatedResult.data as unknown as TResponse[]
    };
  }

}