import { Request, Response, NextFunction } from 'express';
import { OrderOrchestrator } from './OrderOrchestrator';

/**
 * Controlador para Order
 * Maneja las peticiones HTTP y delega la lógica al orquestador
 */
export class OrderController {
  constructor(private orderOrchestrator: OrderOrchestrator) {}

  /**
   * TODO: Implementar métodos del controlador
   *
   * Cada método debe:
   * 1. Extraer datos del request
   * 2. Llamar al método correspondiente del orquestador
   * 3. Devolver la respuesta apropiada
   * 4. Manejar errores con next(error)
   */

  /**
   * Método de ejemplo - Reemplazar con endpoints reales
   */
  executeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extraer datos del request
      // const data = req.body;

      // Llamar al orquestador
      const result = await this.orderOrchestrator.executeOrderProcess();

      // Devolver respuesta
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}