/**
 * Controlador para Library
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { LibraryService } from './LibraryService';
import { CreateLibrarySchema, UpdateLibrarySchema, ICreateLibrary, IUpdateLibrary, libraryToResponse } from './LibrarySchema';
import { ILibrary } from './LibraryModel';

/**
 * Controlador para la entidad Library heredando de BaseController
 */
export class LibraryController extends BaseController<LibraryService> {
  constructor(libraryService: LibraryService) {
    super(libraryService);
  }

  protected buildQuery(req: Request): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    
    // Añadir filtros específicos del recurso aquí
    // Por defecto, mostrar solo elementos no eliminados
    if (req.query.isDeleted === undefined) {
      query.isDeleted = false;
    } else {
      query.isDeleted = req.query.isDeleted === 'true';
    }
    
    return query;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar con Zod
      const parseResult = CreateLibrarySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return this.sendErrorResponse(res, 'Error de validación', 400, parseResult.error.errors);
      }
      
      const data = parseResult.data as ICreateLibrary;
      const newItem = await this.service.create(data);
      
      this.sendSuccessResponse(res, libraryToResponse(newItem as ILibrary), 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      
      // Validar con Zod
      const parseResult = UpdateLibrarySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return this.sendErrorResponse(res, 'Error de validación', 400, parseResult.error.errors);
      }
      
      const data = parseResult.data as IUpdateLibrary;
      const updatedItem = await this.service.update(_id, data);
      
      this.sendSuccessResponse(res, libraryToResponse(updatedItem as ILibrary));
    } catch (error) {
      next(error);
    }
  };

  // Override softDelete y restore para usar libraryToResponse
  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const item = await this.service.softDelete!(_id);
      
      this.sendSuccessResponse(res, libraryToResponse(item as ILibrary));
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const item = await this.service.restore!(_id);
      
      this.sendSuccessResponse(res, libraryToResponse(item as ILibrary));
    } catch (error) {
      next(error);
    }
  };

  findPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = this.buildQuery(req);
      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);
      
      const result = await this.service.findPaginated(query, paginationParams, options);
      
      // Transformar cada item a respuesta
      if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as { data: ILibrary[] }).data)) {
        const transformedData = (result as { data: ILibrary[] }).data.map((item: ILibrary) => libraryToResponse(item as never));
        (result as { data: unknown[] }).data = transformedData;
      }
      
      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchTerm = req.query.term as string;
      if (!searchTerm) {
        return this.sendErrorResponse(res, 'El término de búsqueda es requerido', 400);
      }
      
      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);
      
      const result = await (this.service as LibraryService & { search: (term: string, pagination: unknown, options: unknown) => Promise<unknown> }).search(searchTerm, paginationParams, options);
      
      // Transformar cada item a respuesta
      if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as { data: ILibrary[] }).data)) {
        const transformedData = (result as { data: ILibrary[] }).data.map((item: ILibrary) => libraryToResponse(item as never));
        (result as { data: unknown[] }).data = transformedData;
      }
      
      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

} 