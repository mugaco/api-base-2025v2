import { ClientSession, startSession } from 'mongoose';

/**
 * Clase base para orquestadores que proporciona utilidades comunes
 * como el manejo de transacciones MongoDB
 */
export abstract class BaseOrchestrator {
  /**
   * Ejecuta una operación dentro de una transacción MongoDB
   * Maneja automáticamente:
   * - Inicio y cierre de la sesión
   * - Commit/rollback de la transacción
   * - Reintentos automáticos para errores transitorios (TransientTransactionError)
   * - Reintentos de commit cuando el resultado es desconocido (UnknownTransactionCommitResult)
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
      const txOptions = {
        readPreference: 'primary' as const,
        readConcern: { level: 'snapshot' as const },
        writeConcern: { w: 'majority' as const },
      };

      // session.withTransaction maneja automáticamente los reintentos para:
      // - TransientTransactionError: reintenta toda la transacción
      // - UnknownTransactionCommitResult: reintenta el commit
      return await session.withTransaction(async () => {
        return operation(session);
      }, txOptions);
    } finally {
      await session.endSession();
    }
  }
}