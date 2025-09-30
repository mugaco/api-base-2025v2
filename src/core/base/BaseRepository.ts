import { Document, Model, FilterQuery, UpdateQuery, Query, ClientSession } from 'mongoose';
import { IExtendedRepository } from '@core/base/interfaces/repository.interface';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { MongoQueryBuilder } from '@core/base/queryBuilder/MongoQueryBuilder';
import { SecurityFilterSanitizer, ISanitizerOptions } from '@core/base/security/SecurityFilterSanitizer';
import { ILoggerService } from '@core/services/LoggerService';
import { useNotFoundError } from '@core/hooks/useError';

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
  protected protectedFilterFields: string[] = ['isDeleted'];
  protected allowedFilterFields?: Set<string>;
  protected maxFilterDepth: number = 5;

  constructor(model: Model<T>, activity: ActivityLog, logger: ILoggerService) {
    this.activity = activity;

    this.model = model;
    // Resolver el logger en el constructor, no a nivel de módulo
    this.logger = logger;
    // Configurar filtro permanente para excluir elementos eliminados lógicamente
    this.permanentFilters = { isDeleted: false } as FilterQuery<T>;
  }

  /**
   * Aplica filtros permanentes a una consulta
   */
  protected applyPermanentFilters(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...this.permanentFilters, ...filter };
  }

  /**
   * Sanitiza filtros removiendo campos protegidos y operadores peligrosos
   */
  protected sanitizeFilters(filter: FilterQuery<T>): FilterQuery<T> {
    const options: ISanitizerOptions = {
      allowedFields: this.allowedFilterFields,
      customProtectedFields: this.protectedFilterFields,
      logger: this.logger
    };

    const result = SecurityFilterSanitizer.sanitize<T>(filter, 0, options);

    if (result.violations.length > 0) {
      this.logger.warn('Filter sanitization violations detected', {
        violations: result.violations,
        modelName: this.model.modelName
      });
    }

    return result.sanitized;
  }

  /**
   * Parsea filtros avanzados en formato string a un objeto de consulta MongoDB
   * @param filtersString - String JSON con los filtros
   * @param shouldSanitize - Si true, sanitiza los filtros (por defecto true para filtros del usuario)
   */
  protected parseAdvancedFilters(filtersString: string | undefined, shouldSanitize: boolean = true): FilterQuery<T> {
    if (!filtersString) {
      return {};
    }

    try {
      const filtersObject = JSON.parse(filtersString);

      // Solo sanitizamos si es necesario (filtros del usuario)
      const processedFilters = shouldSanitize
        ? this.sanitizeFilters(filtersObject)
        : filtersObject;

      // Procesamos con MongoQueryBuilder
      const builder = new MongoQueryBuilder(processedFilters);
      return builder.getQuery() as FilterQuery<T>;
    } catch (error) {
      this.logger.error('Error parsing advanced filters', {
        error: error instanceof Error ? error.message : String(error),
        // No logueamos el filtersString completo por seguridad
        modelName: this.model.modelName
      });
      return {};
    }
  }

  /**
   * Encuentra documentos de forma paginada
   * @param filter - Filtro base => simpleSearch
   * @param paginationParams - Parámetros de paginación
   * @param options - Opciones de consulta (proyección, ordenamiento)
   * @param advancedFilters - Filtros avanzados en formato JSON string
   * @param permanentContextFilters - Filtros contextuales adicionales que siempre se aplican (string JSON o null)
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    { page = 1, itemsPerPage = 10 }: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string,
    permanentContextFilters?: string | null
  ): Promise<IPaginatedResponse<T>> {
    // Procesar filtros avanzados del usuario (se sanitizan por defecto)
    const advancedQuery = advancedFilters
      ? this.parseAdvancedFilters(advancedFilters)
      : {};
    // Procesar filtros de contexto del backend (NO se sanitizan - son confiables)
    const permanentContextFiltersQuery = permanentContextFilters
      ? this.parseAdvancedFilters(permanentContextFilters, false)
      : {};
    // Combinar todos los filtros
    const combinedFilter = this.applyPermanentFilters({
      ...filter,
      ...advancedQuery,
      ...permanentContextFiltersQuery
    });
    // console.log('Combined Filter:', JSON.stringify(combinedFilter));
    // Asegurar que page e itemsPerPage sean números válidos
    const validPage = Math.max(1, page);
    const validItemsPerPage = Math.max(1, itemsPerPage);
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
    if ('isDeleted' in combinedFilter) {
      (isDeletedFilter as Record<string, unknown>)['isDeleted'] = (combinedFilter as Record<string, unknown>)['isDeleted'];
    }

    // Combinamos isDeletedFilter con permanentFilters
    const totalItemsFilter = this.applyPermanentFilters({
      ...isDeletedFilter,
      ...permanentContextFiltersQuery
    });
    // console.log('Total Items Filter:', JSON.stringify( totalItemsFilter));
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
  async create(data: Partial<T>, options?: { session?: ClientSession }): Promise<T> {
    const activityData = {
      activity: 'create',
      resource: this.model.modelName,
      data
    };
    this.activity.push(activityData);
    const result = await this.model.create([data], options || {});
    return result[0];
  }

  /**
   * Compara datos antes y después de una actualización
   * Retorna los campos que cambiaron con sus valores old/new
   */
  protected compareData(oldData: T, newData: T): {
    changedFields: string[];
    changes: Record<string, { old: unknown; new: unknown }>;
  } {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const changedFields: string[] = [];

    // Convertir documentos Mongoose a objetos planos para comparación
    const oldObj = oldData.toObject ? oldData.toObject() : oldData;
    const newObj = newData.toObject ? newData.toObject() : newData;

    // Comparar cada campo del nuevo objeto
    for (const key in newObj) {
      // Ignorar campos del sistema y timestamps
      if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }

      const oldValue = oldObj[key];
      const newValue = newObj[key];

      // Comparación profunda para objetos y arrays
      const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

      if (hasChanged) {
        changedFields.push(key);
        changes[key] = {
          old: oldValue,
          new: newValue
        };
      }
    }

    return { changedFields, changes };
  }

  /**
   * Actualiza un documento por su ID
   * Registra los cambios en el ActivityLog
   */
  async update(_id: string, data: UpdateQuery<T>, options?: { session?: ClientSession }): Promise<T | null> {
    // Obtener el documento antes de actualizar
    const oldDocument = await this.model.findById(_id).exec();

    if (!oldDocument) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }

    // Realizar la actualización
    const newDocument = await this._update(_id, data, options);

    if (!newDocument) {
      return null;
    }

    // Comparar y registrar cambios
    const { changedFields, changes } = this.compareData(oldDocument, newDocument);

    const activityData = {
      resource: this.model.modelName,
      activity: 'update',
      id: _id,
      changedFields,
      changes,
      oldData: oldDocument.toObject(),
      newData: newDocument.toObject()
    };

    this.activity.push(activityData);

    return newDocument;
  }

  /**
   * Método interno para actualización sin tracking
   * Usado por softDelete y restore para evitar duplicación de logs
   */
  async _update(_id: string, data: UpdateQuery<T>, options?: { session?: ClientSession }): Promise<T | null> {
    return this.model.findOneAndUpdate(
      { _id: _id },
      data,
      { new: true, ...options }
    ).exec();
  }
  /**
   * Elimina un documento permanentemente
   */
  async delete(_id: string, options?: { session?: ClientSession }): Promise<boolean> {
    const deleted = await this.model.findById(_id).exec();
    if (!deleted) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }

    const activityData = {
      resource: this.model.modelName,
      activity: 'delete',
      id: _id,
      deletedData: deleted
    };
    this.activity.push(activityData);
    const result = await this.model.deleteOne({ _id: _id }, options || {}).exec();
    return result.deletedCount === 1;
  }

  /**
   * Elimina un documento de forma lógica
   */
  async softDelete(_id: string, options?: { session?: ClientSession }): Promise<T | null> {
    // Obtener el documento antes de soft delete
    const document = await this.model.findById(_id).exec();

    if (!document) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }

    const result = await this._update(
      _id,
      { $set: { isDeleted: true, deletedAt: new Date() } } as UpdateQuery<T>,
      options
    );

    this.activity.push({
      resource: this.model.modelName,
      activity: 'softDelete',
      id: _id,
      deletedData: document.toObject()
    });

    return result;
  }

  /**
   * Restaura un documento eliminado lógicamente
   */
  async restore(_id: string, options?: { session?: ClientSession }): Promise<T | null> {
    // Obtener el documento antes de restaurar
    const document = await this.model.findById(_id).exec();

    if (!document) {
      throw useNotFoundError(`Resource with _id ${_id} not found`);
    }

    const result = await this._update(
      _id,
      { $set: { isDeleted: false }, $unset: { deletedAt: 1 } } as UpdateQuery<T>,
      options
    );

    this.activity.push({
      resource: this.model.modelName,
      activity: 'restore',
      id: _id,
      restoredData: result ? result.toObject() : null
    });

    return result;
  }

  /**
   * Cuenta documentos que cumplen con el filtro
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    const combinedFilter = this.applyPermanentFilters(filter);
    return this.model.countDocuments(combinedFilter).exec();
  }

}