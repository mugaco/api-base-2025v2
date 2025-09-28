import { Document, FilterQuery, UpdateQuery } from 'mongoose';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';

export interface IRepository<T extends Document> {
  findAll(
    filter?: FilterQuery<T>,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<T[]>;
  findById(_id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(_id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(_id: string): Promise<boolean>;
  softDelete(_id: string): Promise<T | null>;
  findPaginated(
    filter: FilterQuery<T>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<T>>;
  count(filter?: FilterQuery<T>): Promise<number>;
}

/**
 * Interfaz extendida que incluye métodos opcionales que pueden tener algunos repositorios
 */
export interface IExtendedRepository<T extends Document> extends IRepository<T> {
  restore?(id: string): Promise<T | null>;
  getAllActive?(query: FilterQuery<T>): Promise<T[]>;
} 