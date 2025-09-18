/**
 * Controlador para Tag
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { TagService } from './TagService';

/**
 * Controlador para la entidad Tag heredando de BaseController
 */
export class TagController extends BaseController<TagService> {
  constructor(tagService: TagService) {
    super(tagService);
  }

  /**
   * Construye la query específica para Tag
   * Este método es requerido por BaseController
   */
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

      const result = await this.service.search(searchTerm, paginationParams, options);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };
} 