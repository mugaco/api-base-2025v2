import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';

/**
 * Tipo genérico para queries de filtrado
 */
export type FilterQuery = Record<string, unknown>;

export interface IService<T, CreateDTO, UpdateDTO> {
  getAll(query?: FilterQuery, options?: IQueryOptions, advancedFilters?: string): Promise<T[]>;
  findById(_id: string): Promise<T>;
  findOne(query: FilterQuery): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(_id: string, data: UpdateDTO): Promise<T>;
  delete(_id: string): Promise<boolean>;
  softDelete?(_id: string): Promise<T>;
  restore?(_id: string): Promise<T>;
  getPaginated(
    query: FilterQuery,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<T>>;
} 