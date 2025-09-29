import { ClientSession, startSession } from 'mongoose';

/**
 * Clase base para orquestadores que proporciona utilidades comunes
 * como el manejo de transacciones MongoDB
 */
export abstract class BaseOrchestrator {
  /**
   * Ejecuta una operación dentro de una transacción MongoDB
   * Maneja automáticamente el inicio, commit/rollback y cierre de la sesión
   *
   * @param operation - Función que recibe la sesión y ejecuta las operaciones
   * @returns Promise con el resultado de la operación
   *
   * @example
   * ```typescript
   * async processOrder(data: OrderData): Promise<Order> {
   *   return this.withTransaction(async (session) => {
   *     const order = await this.orderService.create(data, { session });
   *     await this.inventoryService.decrementStock(data.items, { session });
   *     return order;
   *   });
   * }
   * ```
   */
  protected async withTransaction<ResultType>(
    operation: (session: ClientSession) => Promise<ResultType>
  ): Promise<ResultType> {
    const session = await startSession();

    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}