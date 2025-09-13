/**
 * Servicio para Prueba
 */
import { BaseService } from '@core/bases/BaseService';
import { PruebaRepository } from './PruebaRepository';
import { IPrueba } from './PruebaModel';
import { ICreatePrueba, IUpdatePrueba, IPruebaResponse } from './PruebaSchema';


/**
 * Servicio para la entidad Prueba heredando de BaseService
 */
export class PruebaService extends BaseService<IPrueba, IPruebaResponse, ICreatePrueba, IUpdatePrueba> {
  
  constructor(pruebaRepository: PruebaRepository) {
    // PruebaRepository extiende BaseRepository que implementa IExtendedRepository
    super(pruebaRepository);
  }



  // Aquí puedes sobrescribir otros métodos de BaseService si necesitas
  // comportamiento específico para Prueba. Por ejemplo:
  
  // async create(data: ICreatePrueba): Promise<IPruebaResponse> {
  //   // Lógica específica antes de crear
  //   // Por ejemplo, validaciones adicionales o transformación de datos
  //   
  //   const result = await super.create(data);
  //   
  //   // Lógica específica después de crear
  //   // Por ejemplo, enviar notificaciones o actualizar caché
  //   
  //   return result;
  // }
  
  // async update(_id: string, data: IUpdatePrueba): Promise<IPruebaResponse> {
  //   // Lógica específica antes de actualizar
  //   
  //   const result = await super.update(_id, data);
  //   
  //   // Lógica específica después de actualizar
  //   
  //   return result;
  // }
}