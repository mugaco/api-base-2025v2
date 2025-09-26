import { Document, Model, FilterQuery, UpdateQuery, Query } from 'mongoose';
import { IExtendedRepository } from '@core/base/interfaces/repository.interface';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { MongoQueryBuilder } from '@core/base/queryBuilder/MongoQueryBuilder';
import { ILoggerService } from '@core/services/LoggerService';

// import { Container } from '@core/Container';
import { ActivityLog } from '@core/ActivityLog';

/**
 * Clase base abstracta para repositorios MongoDB
 * Proporciona operaciones CRUD comunes utilizando herencia
 */
export abstract class BaseRepository<T extends Document> implements IExtendedRepository<T> {
  protected model: Model<T>;
  protected permanentFilters: FilterQuery<T> = {};
  protected logger: ILoggerService;
  protected activity: ActivityLog;

  constructor(model: Model<T>, activity: ActivityLog, logger: ILoggerService) {
    this.activity = activity;

    this.model = model;
    // Resolver el logger en el constructor, no a nivel de módulo
    this.logger = logger;
  }

  /**
   * Aplica filtros permanentes a una consulta
   */
  protected applyPermanentFilters(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...this.permanentFilters, ...filter };
  }

  /**
   * Parsea filtros avanzados en formato string a un objeto de consulta MongoDB
   */
  protected parseAdvancedFilters(filtersString: string | undefined): FilterQuery<T> {
    if (!filtersString) {
      return {};
    }

    try {
      const filtersObject = JSON.parse(filtersString);
      const builder = new MongoQueryBuilder(filtersObject);
      return builder.getQuery() as FilterQuery<T>;
    } catch (error) {
      this.logger.error('Error parsing advanced filters', {
        error: error instanceof Error ? error.message : String(error),
        filtersString,
        stack: error instanceof Error ? error.stack : undefined
      });
      return {};
    }
  }

  /**
   * Encuentra todos los documentos que cumplen con el filtro
   */
  async findAll(filter: FilterQuery<T> = {}, options?: IQueryOptions): Promise<T[]> {
    const combinedFilter = this.applyPermanentFilters(filter);

    let query: Query<T[], T> = this.model.find(combinedFilter);

    if (options?.projection) {
      query = query.select(options.projection) as unknown as Query<T[], T>;
    }

    if (options?.sortBy && options.sortBy.length > 0) {
      const sortObject: Record<string, 1 | -1> = {};

      options.sortBy.forEach((field, index) => {
        const isDesc = options.sortDesc && options.sortDesc[index] === true;
        sortObject[field] = isDesc ? -1 : 1;
      });

      query = query.sort(sortObject);
    }
    return query.exec();
  }

  /**
   * Encuentra un documento por su ID
   */
  async findById(_id: string): Promise<T | null> {
    this.activity.push({ model: this.model.modelName, id: _id });

    return this.model.findById(_id).exec();
  }

  /**
   * Encuentra un documento que cumpla con el filtro
   */
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    const combinedFilter = this.applyPermanentFilters(filter);
    return this.model.findOne(combinedFilter).exec();
  }

  /**
   * Crea un nuevo documento
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  /**
   * Actualiza un documento por su ID
   */
  async update(_id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(
      { _id: _id },
      data,
      { new: true }
    ).exec();
  }

  /**
   * Elimina un documento permanentemente
   */
  async delete(_id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: _id }).exec();
    return result.deletedCount === 1;
  }

  /**
   * Elimina un documento de forma lógica
   */
  async softDelete(_id: string): Promise<T | null> {
    return this.update(
      _id,
      { $set: { isDeleted: true, deletedAt: new Date() } } as UpdateQuery<T>
    );
  }

  /**
   * Restaura un documento eliminado lógicamente
   */
  async restore(_id: string): Promise<T | null> {
    return this.update(
      _id,
      { $set: { isDeleted: false }, $unset: { deletedAt: 1 } } as UpdateQuery<T>
    );
  }

  /**
   * Encuentra documentos de forma paginada
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    { page = 1, itemsPerPage = 10 }: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<T>> {
    // Asegurar que page e itemsPerPage sean números válidos
    const validPage = Math.max(1, page);
    const validItemsPerPage = Math.max(1, itemsPerPage);

    const combinedFilter = this.applyPermanentFilters(filter);
    const skip = (validPage - 1) * validItemsPerPage;

    let query: Query<T[], T> = this.model.find(combinedFilter);

    if (options?.projection) {
      query = query.select(options.projection) as unknown as Query<T[], T>;
    }

    if (options?.sortBy && options.sortBy.length > 0) {
      const sortObject: Record<string, 1 | -1> = {};

      options.sortBy.forEach((field, index) => {
        const isDesc = options.sortDesc && options.sortDesc[index] === true;
        sortObject[field] = isDesc ? -1 : 1;
      });

      query = query.sort(sortObject);
    }

    // Aplicar limit explícitamente con el valor validado
    const data = await query.skip(skip).limit(validItemsPerPage).exec();
    const totalFilteredRows = await this.model.countDocuments(combinedFilter).exec();

    // Para totalRows, solo consideramos isDeleted, ignorando otros filtros de búsqueda
    const isDeletedFilter: FilterQuery<T> = {};

    // Si se está filtrando por isDeleted, mantenemos ese filtro para totalRows
    if ('isDeleted' in filter) {
      (isDeletedFilter as Record<string, unknown>)['isDeleted'] = (filter as Record<string, unknown>)['isDeleted'];
    }

    // Combinamos isDeletedFilter con permanentFilters
    const totalItemsFilter = this.applyPermanentFilters(isDeletedFilter);
    const totalRows = await this.model.countDocuments(totalItemsFilter).exec();

    return {
      data,
      pagination: {
        page: validPage,
        itemsPerPage: validItemsPerPage,
        totalFilteredRows,
        totalRows,
        pages: Math.ceil(totalFilteredRows / validItemsPerPage)
      }
    };
  }

  /**
   * Cuenta documentos que cumplen con el filtro
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    const combinedFilter = this.applyPermanentFilters(filter);
    return this.model.countDocuments(combinedFilter).exec();
  }

  /**
   * Obtiene todos los elementos que no han sido eliminados lógicamente
   */
  async getAllActive(query: FilterQuery<T> = {}): Promise<T[]> {
    return this.findAll({ ...query, isDeleted: false } as FilterQuery<T>);
  }

  /**
   * Encuentra todos los elementos usando filtros avanzados
   */
  async findAllWithFilters(
    filter: FilterQuery<T> = {},
    advancedFilters?: string
  ): Promise<T[]> {
    // Procesar filtros avanzados si existen
    let advancedFiltersQuery = {};
    if (advancedFilters) {
      advancedFiltersQuery = this.parseAdvancedFilters(advancedFilters);
    }

    // Combinar todos los filtros
    const combinedFilter = {
      ...this.permanentFilters,
      ...filter,
      ...advancedFiltersQuery
    };

    return this.model.find(combinedFilter).exec();
  }

  /**
   * Encuentra elementos de forma paginada usando filtros avanzados
   */
  async findPaginatedWithFilters(
    filter: FilterQuery<T>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<T>> {
    // Procesar filtros avanzados si existen
    let advancedFiltersQuery = {};
    if (advancedFilters) {
      advancedFiltersQuery = this.parseAdvancedFilters(advancedFilters);
    }

    // Combinar filtros con filtros avanzados
    const filterWithAdvanced = {
      ...filter,
      ...advancedFiltersQuery
    };

    // Usar el método findPaginated existente con los filtros combinados
    return this.findPaginated(filterWithAdvanced, paginationParams, options);
  }
}