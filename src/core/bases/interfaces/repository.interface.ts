import { Document, FilterQuery, UpdateQuery } from 'mongoose';
import { IPaginationParams } from '@core/bases/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/bases/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/bases/interfaces/QueryOptions.interface';

export interface IRepository<T extends Document> {
  findAll(filter?: FilterQuery<T>, options?: IQueryOptions): Promise<T[]>;
  findById(_id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(_id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(_id: string): Promise<boolean>;
  softDelete(_id: string): Promise<T | null>;
  findPaginated(
    filter: FilterQuery<T>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<T>>;
  count(filter?: FilterQuery<T>): Promise<number>;
  
  // Nuevos métodos que soportan filtros avanzados (sin permanentFilters)
  findAllWithFilters(
    filter?: FilterQuery<T>, 
    advancedFilters?: string
  ): Promise<T[]>;
  
  findPaginatedWithFilters(
    filter: FilterQuery<T>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<T>>;
}

/**
 * Interfaz extendida que incluye métodos opcionales que pueden tener algunos repositorios
 */
export interface IExtendedRepository<T extends Document> extends IRepository<T> {
  restore?(id: string): Promise<T | null>;
  getAllActive?(query: FilterQuery<T>): Promise<T[]>;
} 