import { IPaginationParams } from '@core/bases/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/bases/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/bases/interfaces/QueryOptions.interface';

/**
 * Tipo genérico para queries de filtrado
 */
type FilterQuery = Record<string, unknown>;

export interface IService<T, CreateDTO, UpdateDTO> {
  getAll(query?: FilterQuery): Promise<T[]>;
  getById(_id: string): Promise<T>;
  findOne(query: FilterQuery): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(_id: string, data: UpdateDTO): Promise<T>;
  delete(_id: string): Promise<boolean>;
  softDelete(_id: string): Promise<T>;
  getPaginated(
    query: FilterQuery,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<T>>;
} 