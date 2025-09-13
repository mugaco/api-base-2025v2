/**
 * Controlador para Prueba
 */
import { Request } from 'express';
import { BaseController } from '@core/bases/BaseController';
import { PruebaService } from './PruebaService';

/**
 * Controlador para la entidad Prueba heredando de BaseController
 */
export class PruebaController extends BaseController<PruebaService> {
  constructor(pruebaService: PruebaService) {
    super(pruebaService);
  }

  /**
   * Construye la query específica para Prueba
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

  // Aquí puedes sobrescribir cualquier método de BaseController si necesitas
  // comportamiento específico para Prueba. Por ejemplo:
  
  // create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const data = req.body as ICreatePrueba;
  //     // Lógica específica para crear una Prueba
  //     const newItem = await this.service.create(data);
  //     this.sendSuccessResponse(res, newItem, 201);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  
  // update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const _id = req.params._id;
  //     const data = req.body as IUpdatePrueba;
  //     // Lógica específica para actualizar una Prueba
  //     const updatedItem = await this.service.update(_id, data);
  //     this.sendSuccessResponse(res, updatedItem);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}