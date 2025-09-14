/**
 * Controlador para Access CRUD
 * Solo maneja operaciones CRUD sobre la entidad Access
 */
import { Request } from 'express';
import { BaseController } from '@core/base/BaseController';
import { AccessService } from './AccessService';

/**
 * Controlador para la entidad Access heredando de BaseController
 */
export class AccessController extends BaseController<AccessService> {
  constructor(accessService: AccessService) {
    super(accessService);
  }

  /**
   * Construye la query específica para Access
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
    
    // Filtrar por usuario si se proporciona
    if (req.query.user_id) {
      query.user_id = req.query.user_id;
    }
    
    // Filtrar por estado de revocación
    if (req.query.is_revoked !== undefined) {
      query.is_revoked = req.query.is_revoked === 'true';
    }
    
    return query;
  }
}