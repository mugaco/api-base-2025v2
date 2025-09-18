/**
 * Controlador para LibraryTag
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { LibraryTagService } from './LibraryTagService';
import {
  CreateLibraryTagSchema,
  UpdateLibraryTagSchema,
  ICreateLibraryTag,
  IUpdateLibraryTag
} from './LibraryTagSchema';

/**
 * Controlador para la entidad LibraryTag heredando de BaseController
 */
export class LibraryTagController extends BaseController<LibraryTagService> {
  constructor(libraryTagService: LibraryTagService) {
    super(libraryTagService);
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

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchTerm = req.query.term as string;
      if (!searchTerm) {
        return this.sendErrorResponse(res, 'El término de búsqueda es requerido', 400);
      }
      
      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);
      
      const result = await (this.service as LibraryTagService & { search: (term: string, pagination: unknown, options: unknown) => Promise<unknown> }).search(searchTerm, paginationParams, options);
      
      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar datos con Zod
      const validationResult = CreateLibraryTagSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const formattedErrors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return this.sendErrorResponse(
          res, 
          'Datos de entrada inválidos', 
          400, 
          formattedErrors
        );
      }
      
      const data = validationResult.data as ICreateLibraryTag;
      const newItem = await this.service.create(data);
      
      this.sendSuccessResponse(res, newItem, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar datos con Zod
      const validationResult = UpdateLibraryTagSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const formattedErrors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return this.sendErrorResponse(
          res, 
          'Datos de actualización inválidos', 
          400, 
          formattedErrors
        );
      }
      
      const _id = req.params._id;
      const data = validationResult.data as IUpdateLibraryTag;
      const updatedItem = await this.service.update(_id, data);
      
      this.sendSuccessResponse(res, updatedItem);
    } catch (error) {
      next(error);
    }
  };

} 