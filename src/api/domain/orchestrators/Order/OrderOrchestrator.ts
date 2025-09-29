/**
 * Orquestador para Order
 * Coordina operaciones entre múltiples servicios
 *
 * IMPORTANTE: Los orquestadores NO deben inyectar repositorios directamente.
 * Solo deben coordinar servicios existentes.
 */

// Importaciones de servicios necesarios
import { BaseOrchestrator } from '@core/base/BaseOrchestrator';
import { PruebaService } from '@api/domain/entities/Prueba/PruebaService';
import { ProductService } from '../../entities/ProductPrueba/ProductService';
import { IEventService } from '@core/services/EventService';
import { PRUEBA_EVENT, PruebaEventData } from '@api/eventsListeners/events/prueba/prueba.event';

/**
 * OrderOrchestrator
 *
 * Este orquestador coordina las operaciones relacionadas con order.
 * Implementa la lógica de negocio compleja que involucra múltiples entidades.
 */
export class OrderOrchestrator extends BaseOrchestrator {
  constructor(
    // Servicios inyectados
    private pruebaService: PruebaService,
    private productService: ProductService,
    private eventService: IEventService, // Los orquestadores pueden inyectar EventService
  ) {
    super();
  }

  /**
   * TODO: Implementar métodos de orquestación
   *
   * Ejemplo de método de orquestación:
   *
   * async processComplexOperation(data: any) {
   *   // 1. Validar condiciones de negocio
   *   // 2. Coordinar operaciones entre servicios
   *   // 3. Manejar transacciones si es necesario
   *   // 4. Emitir eventos si corresponde
   *   // 5. Retornar resultado consolidado
   * }
   */

  /**
   * Método de ejemplo - Reemplazar con lógica real
   */
  // async executeOrderProcess(): Promise<unknown> {
  //   // TODO: Implementar la lógica de orquestación
  //   // Este es solo un ejemplo, debe ser reemplazado con la lógica real
  //   const id= "68206276b71563d87756d759"
  //   const act= {name: "foo"}

  //   // Emitir evento de prueba antes de la operación
  //   await this.eventService.emit(PRUEBA_EVENT, {
  //     name: "Prueba desde OrderOrchestrator - Inicio",
  //     timestamp: new Date()
  //   } as PruebaEventData);

  //   const pruebas= this.pruebaService.update(id, act);

  //   // Emitir evento de prueba después de la operación
  //   await this.eventService.emit(PRUEBA_EVENT, {
  //     name: "Prueba desde OrderOrchestrator - Completado",
  //     timestamp: new Date()
  //   } as PruebaEventData);

  //   return pruebas;
  // }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  async executeOrderProcess(data: any): Promise<unknown> {

    return this.withTransaction(async (session) => {
      // Emitir evento de prueba antes de la operación
      await this.eventService.emit(PRUEBA_EVENT, {
        name: "Prueba desde OrderOrchestrator - Inicio",
        timestamp: new Date()
      } as PruebaEventData);

      const nuevaPrueba = {
        user_id: data.user_id,
        name: data.prueba.name,
        isDeleted: false
      };
      const nuevoProduct = {
        user_id: data.user_id,
        name: data.product.name,
        price: data.product.price,
        active: data.product.active,
        isDeleted: false
      };
      const prueba = await this.pruebaService.create(nuevaPrueba, { session });
      const producto = await this.productService.create(nuevoProduct, { session });

      // Emitir evento de prueba después de la operación
      await this.eventService.emit(PRUEBA_EVENT, {
        name: "Prueba desde OrderOrchestrator - Completado",
        timestamp: new Date()
      } as PruebaEventData);

      // return { prueba };
      return { prueba, producto };
    });
  }
}