/**
 * Controlador para Prueba
 */
import { BaseController } from '@core/base/BaseController';
import { PruebaService } from './PruebaService';

/**
 * Controlador para la entidad Prueba heredando de BaseController
 */
export class PruebaController extends BaseController<PruebaService> {
  constructor(pruebaService: PruebaService) {
    super(pruebaService);
  }
}