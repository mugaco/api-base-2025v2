/**
 * Controlador para MediaTag
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { MediaTagService } from './MediaTagService';

/**
 * Controlador para la entidad MediaTag heredando de BaseController
 */
export class MediaTagController extends BaseController<MediaTagService> {
  constructor(mediaTagService: MediaTagService) {
    super(mediaTagService);
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
      
      const result = await (this.service as MediaTagService & { search: (term: string, pagination: unknown, options: unknown) => Promise<unknown> }).search(searchTerm, paginationParams, options);
      
      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };
} 