import { Request, Response, NextFunction } from 'express';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IGetQueryParams } from '@core/base/interfaces/GetQueryParams.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { IController } from '@core/base/interfaces/controller.interface';
import { IService, FilterQuery } from '@core/base/interfaces/service.interface';

/**
 * Extensión de IService para incluir métodos específicos del BaseController
 */
interface ICrudService<T = unknown, CreateDTO = unknown, UpdateDTO = unknown> extends IService<T, CreateDTO, UpdateDTO> {
  // Método adicional para filtros avanzados (opcional)
  getPaginatedWithFilters?(
    filter: FilterQuery,
    paginationParams: IPaginationParams,
    options?: IQueryOptions,
    advancedFilters?: string
  ): Promise<IPaginatedResponse<T>>;

  // restore ya está en IService como opcional
}

/**
 * Clase base abstracta para controladores
 * Proporciona operaciones comunes utilizando herencia
 */
export abstract class BaseController<TService extends ICrudService = ICrudService> implements IController {
  protected service: TService;

  constructor(service: TService) {
    this.service = service;
  }

  /**
   * Type guard para verificar si un resultado es una respuesta paginada
   */
  private isPaginatedResponse<T>(data: unknown): data is IPaginatedResponse<T> {
    return (
      data !== null &&
      typeof data === 'object' &&
      'data' in data &&
      'pagination' in data &&
      Array.isArray((data as IPaginatedResponse<T>).data) &&
      typeof (data as IPaginatedResponse<T>).pagination === 'object'
    );
  }

  /**
   * Envía una respuesta de éxito
   */
  protected sendSuccessResponse(
    res: Response, 
    data: unknown, 
    statusCode = 200
  ): void {
    // Detectar si es una respuesta paginada para corregir el formato
    if (this.isPaginatedResponse(data)) {
      // Es una respuesta paginada, extraer los datos y la paginación al mismo nivel
      res.status(statusCode).json({
        status: 'success',
        data: data.data,
        pagination: data.pagination
      });
    } else {
      // Respuesta normal
      res.status(statusCode).json({
        status: 'success',
        data
      });
    }
  }

  /**
   * Envía una respuesta de error
   */
  protected sendErrorResponse(
    res: Response, 
    message: string, 
    statusCode = 400,
    errors?: unknown[]
  ): void {
    res.status(statusCode).json({
      status: 'error',
      message,
      errors
    });
  }

  /**
   * Extrae y valida parámetros de paginación de la solicitud
   * Aplica un límite máximo de 100 registros por página por seguridad
   * @throws Error cuando se solicitan más de 100 registros por página
   */
  protected extractPaginationParams(req: Request): IPaginationParams {
    // Obtener valores de la query
    const query = req.query as unknown as IGetQueryParams;
    const pageStr = query.page as unknown as string;
    
    // Admitir diferentes formatos para el parámetro de items por página
    const itemsPerPageStr = 
      (query.itemsPerPage as unknown as string) || 
      (query.items_per_page as unknown as string) || 
      (query['items-per-page'] as unknown as string);
    
    // Parsear a números con validación
    let page = 1;
    if (pageStr !== undefined) {
      const parsedPage = parseInt(pageStr, 10);
      // Asegurar que page sea un número válido mayor que 0
      page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    }
    
    // Valor por defecto: 10 registros por página
    const DEFAULT_ITEMS_PER_PAGE = 10;
    // Límite máximo: 100 registros por página por seguridad
    const MAX_ITEMS_PER_PAGE = 100;
    
    let itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
    if (itemsPerPageStr !== undefined) {
      const parsedItemsPerPage = parseInt(itemsPerPageStr, 10);
      
      // Si el valor no es un número o es menor que 1, usar el valor por defecto
      if (isNaN(parsedItemsPerPage) || parsedItemsPerPage < 1) {
        itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
      } 
      // Si el valor supera el máximo permitido, lanzar un error
      else if (parsedItemsPerPage > MAX_ITEMS_PER_PAGE) {
        throw new Error(`El parámetro itemsPerPage no puede superar ${MAX_ITEMS_PER_PAGE}. Valor solicitado: ${parsedItemsPerPage}`);
      } 
      // Si el valor es válido, usarlo
      else {
        itemsPerPage = parsedItemsPerPage;
      }
    }
    
    return {
      page,
      itemsPerPage
    };
  }

  /**
   * Extrae opciones de consulta de la solicitud (ordenación, proyección, etc.)
   */
  protected extractQueryOptions(req: Request): IQueryOptions {
    const query = req.query as unknown as IGetQueryParams;
    const options: IQueryOptions = {};
    
    // Procesar parámetros de ordenación si existen
    if (query.sortBy) {
      // Si es un string, intentar parsearlo como JSON si empieza por "[", de lo contrario tratarlo como string simple
      if (typeof query.sortBy === 'string') {
        try {
          // Intentar parsear como JSON
          const sortByStr = query.sortBy as string;
          if (sortByStr.trim().startsWith('[')) {
            options.sortBy = JSON.parse(sortByStr);
          } else {
            options.sortBy = [sortByStr];
          }
        } catch {
          // Si falla el parse, tratarlo como string normal
          options.sortBy = [query.sortBy as string];
        }
      } else if (Array.isArray(query.sortBy)) {
        options.sortBy = query.sortBy as string[];
      }
      
      // Procesar dirección de ordenación
      if (query.sortDesc) {
        if (typeof query.sortDesc === 'string') {
          try {
            // Intentar parsear como JSON si parece un array
            const sortDescStr = query.sortDesc as string;
            if (sortDescStr.trim().startsWith('[')) {
              const parsedDesc = JSON.parse(sortDescStr);
              // Asegurar que son booleanos
              options.sortDesc = Array.isArray(parsedDesc) 
                ? parsedDesc.map(item => String(item).toLowerCase() === 'true')
                : [String(parsedDesc).toLowerCase() === 'true'];
            } else {
              // Convertir string "true"/"false" a booleano
              options.sortDesc = [sortDescStr.toLowerCase() === 'true'];
            }
          } catch {
            // Si falla el parse, tratar como string normal
            const sortDescStr = String(query.sortDesc).toLowerCase();
            options.sortDesc = [sortDescStr === 'true'];
          }
        } else if (Array.isArray(query.sortDesc)) {
          // Convertir array a array de booleanos de forma segura
          options.sortDesc = Array.from(query.sortDesc).map(
            item => String(item).toLowerCase() === 'true'
          );
        }
      }
    }
    
    // Procesar parámetros de proyección de campos si existen
    if (query.fields) {
      options.projection = query.fields as string;
    }
    
    return options;
  }

  /**
   * Extrae los filtros de la solicitud HTTP
   */
  protected extractFilters(req: Request): { filters?: string } {
    const filters = req.query.filters;
    return {
      filters: filters as string
    };
  }

  /**
   * Procesa el parámetro simpleSearch para construir condiciones de búsqueda
   * Formato esperado: { search: "término de búsqueda", fields: ["campo1", "campo2"] }
   */
  protected processSimpleSearch(req: Request): FilterQuery | null {
    try {
      // Si no hay parámetro simpleSearch, retornar null
      if (!req.query.simpleSearch) {
        return null;
      }
      
      // Intentar parsear el JSON
      const simpleSearch = JSON.parse(req.query.simpleSearch as string);
      
      // Validar estructura básica
      if (!simpleSearch.search || !simpleSearch.fields || !Array.isArray(simpleSearch.fields) || simpleSearch.fields.length === 0) {
        throw new Error('Formato inválido para simpleSearch. El formato correcto es: {"search":"término","fields":["campo1","campo2"]}');
      }
      
      // Construir condiciones de búsqueda
      return {
        $or: simpleSearch.fields.map((field: string) => ({
          [field]: { $regex: simpleSearch.search, $options: 'i' }
        }))
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Formato JSON inválido para simpleSearch');
      }
      throw error;
    }
  }

  /**
   * Método unificado para manejar solicitudes GET con o sin paginación
   * Determina automáticamente si usar paginación basado en la presencia del parámetro 'page'
   * Si no se especifica paginación, aplica un límite máximo de 100 registros por seguridad
   *
   * @param req - Objeto de solicitud de Express con parámetros de consulta (ver IGetQueryParams)
   * @param res - Objeto de respuesta de Express
   */
  protected async handleGetRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    // Consulta base vacía - solo usamos filters y simpleSearch
    const baseQuery: FilterQuery = {};
    const queryParams = req.query as unknown as IGetQueryParams;
    const filtersInfo = this.extractFilters(req);

    try {
      // Procesar simpleSearch si existe
      let finalQuery = baseQuery;
      try {
        const simpleSearchQuery = this.processSimpleSearch(req);
        if (simpleSearchQuery) {
          // Combinar la consulta base con las condiciones de búsqueda simple
          finalQuery = { ...baseQuery, ...simpleSearchQuery };
        }
      } catch (searchError) {
        const errorMessage = searchError instanceof Error ? searchError.message : 'Error processing search parameters';
        return this.sendErrorResponse(res, errorMessage, 400);
      }
      
      // Verificar si se solicita paginación (si existe el parámetro page)
      if (queryParams.page !== undefined) {
        // Comportamiento de getPaginated
        const paginationParams = this.extractPaginationParams(req);
        const options = this.extractQueryOptions(req);
        
        const result = filtersInfo.filters && this.service.getPaginatedWithFilters
          ? await this.service.getPaginatedWithFilters(
              finalQuery,
              paginationParams,
              options,
              filtersInfo.filters
            )
          : await this.service.getPaginated(finalQuery, paginationParams, options);
        
        this.sendSuccessResponse(res, result);
      } else {
        // Comportamiento de getAll pero con un límite de seguridad
        // Aplicar paginación con límite máximo por defecto (100 registros)
        const MAX_ITEMS = 100;
        const safetyPaginationParams = {
          page: 1,
          itemsPerPage: MAX_ITEMS
        };
        const options = this.extractQueryOptions(req);
        
        const result = filtersInfo.filters && this.service.getPaginatedWithFilters
          ? await this.service.getPaginatedWithFilters(
              finalQuery,
              safetyPaginationParams,
              options,
              filtersInfo.filters
            )
          : await this.service.getPaginated(finalQuery, safetyPaginationParams, options);
        
        // Respuesta con datos y mensaje informativo sobre el límite aplicado
        if (this.isPaginatedResponse(result)) {
          res.status(200).json({
            status: 'success',
            data: result.data,
            info: {
              message: `Se ha aplicado un límite automático de ${MAX_ITEMS} registros. Si necesita más registros, utilice paginación con los parámetros 'page' y 'itemsPerPage'.`,
              totalRows: result.pagination.totalRows,
              limit: MAX_ITEMS,
              limitApplied: true
            }
          });
        } else {
          // Fallback si no es una respuesta paginada
          res.status(200).json({
            status: 'success',
            data: result,
            info: {
              message: `Se ha aplicado un límite automático de ${MAX_ITEMS} registros.`,
              limit: MAX_ITEMS,
              limitApplied: true
            }
          });
        }
      }
    } catch (error) {
      // Capturar errores específicos de límite excedido
      if (error instanceof Error && error.message && error.message.includes('El parámetro itemsPerPage no puede superar')) {
        this.sendErrorResponse(
          res, 
          error.message, 
          400, // Bad Request
          [{ 
            field: 'itemsPerPage', 
            message: `El valor máximo permitido es 100. Utilice paginación para obtener más registros.`
          }]
        );
      } else {
        // Reenviar otros errores para que sean manejados por el middleware de errores global
        throw error;
      }
    }
  }


  // Métodos CRUD estándar que pueden ser sobrescritos por las clases hijas

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Solo usar filtros avanzados - no buildQuery
      const items = await this.service.getAll({});

      this.sendSuccessResponse(res, items);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Método unificado que maneja tanto las solicitudes getAll como getPaginated
   * basado en la presencia del parámetro 'page'
   * Procesa filtros avanzados y búsqueda simple
   */
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.handleGetRequest(req, res);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const item = await this.service.findById(_id);
      
      this.sendSuccessResponse(res, item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;
      const newItem = await this.service.create(data);
      
      this.sendSuccessResponse(res, newItem, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const data = req.body;
      const updatedItem = await this.service.update(_id, data);
      
      this.sendSuccessResponse(res, updatedItem);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      await this.service.delete(_id);

      this.sendSuccessResponse(res, { message: 'Resource deleted successfully' }, 200);
    } catch (error) {
      next(error);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      if (!this.service.softDelete) {
        return this.sendErrorResponse(res, 'Soft delete not supported', 404);
      }
      const item = await this.service.softDelete(_id);
      
      this.sendSuccessResponse(res, item);
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      if (!this.service.restore) {
        return this.sendErrorResponse(res, 'Restore not supported', 404);
      }
      const item = await this.service.restore(_id);
      
      this.sendSuccessResponse(res, item);
    } catch (error) {
      next(error);
    }
  };

  getPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Solo usar filtros avanzados - no buildQuery
      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);

      const result = await this.service.getPaginated({}, paginationParams, options);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

}