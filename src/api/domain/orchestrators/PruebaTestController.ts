/**
 * Controller para el orquestador PruebaTest
 */
import { Request, Response } from 'express';
import { PruebaTestService } from './PruebaTestService';
import { z } from 'zod';

// Schema de validación para los parámetros de URL
const FindDobleParamsSchema = z.object({
  prueba_id: z.string().min(1, 'prueba_id es requerido'),
  test_id: z.string().min(1, 'test_id es requerido')
});

/**
 * Controller que maneja las rutas del orquestador PruebaTest
 */
export class PruebaTestController {
  constructor(private pruebaTestService: PruebaTestService) {}

  /**
   * Endpoint para buscar y mergear una Prueba y un Test
   * GET /api/prueba-test/find-doble/:prueba_id/:test_id
   */
  async findDoble(req: Request, res: Response): Promise<void> {
    try {
      // Validar parámetros de URL
      const params = FindDobleParamsSchema.parse(req.params);

      // Llamar al orquestador
      const result = await this.pruebaTestService.findDoble(
        params.prueba_id,
        params.test_id
      );

      res.json({
        success: true,
        data: result,
        message: 'Prueba y Test encontrados y mergeados exitosamente'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}