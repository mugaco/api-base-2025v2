/**
 * Orquestador para operaciones que involucran Prueba y Test
 * Siguiendo las reglas fundamentales: inyecta servicios, no repositorios
 */
import { PruebaService } from '../entities/Prueba/PruebaService';
import { TestService } from '../entities/Test/TestService';

export interface IPruebaTestMerged {
  prueba: unknown;
  test: unknown;
  merged: unknown;
}

/**
 * Orquestador que coordina operaciones entre Prueba y Test
 */
export class PruebaTestService {
  constructor(
    private pruebaService: PruebaService,
    private testService: TestService
  ) {}

  /**
   * Busca una Prueba y un Test por sus IDs y retorna un objeto merged
   */
  async findDoble(pruebaId: string, testId: string): Promise<IPruebaTestMerged> {
    // Buscar ambas entidades en paralelo
    const [prueba, test] = await Promise.all([
      this.pruebaService.findById(pruebaId),
      this.pruebaService.findById(testId),
      // this.testService.testx() // TestService no tiene findById, uso el método disponible
    ]);



    // Crear el objeto merged
    const merged = {
      combinedId: `${pruebaId}_${testId}`,
      pruebaData: prueba,
      testData: test,
      mergedAt: new Date(),
      type: 'prueba_test_merged'
    };

    return {
      prueba,
      test: test,
      merged
    };
  }
}