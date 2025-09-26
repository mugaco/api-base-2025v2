/**
 * Controlador para Category
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { CategoryService } from './CategoryService';

/**
 * Controlador para la entidad Category heredando de BaseController
 */
export class CategoryController extends BaseController<CategoryService> {
  constructor(categoryService: CategoryService) {
    super(categoryService);
  }

  // MÉTODOS ESPECÍFICOS DE LA ENTIDAD
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