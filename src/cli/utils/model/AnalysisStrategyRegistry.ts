/**
 * Registro de estrategias de análisis
 */
import { ModelAnalysisStrategy, ModelStructure } from './interfaces/AnalysisStrategy';
import { MongooseAnalysisStrategy } from './strategies/analysis/MongooseAnalysisStrategy';

export class AnalysisStrategyRegistry {
  private strategies: ModelAnalysisStrategy[] = [];

  /**
   * Constructor
   */
  constructor() {
    // Registrar estrategias predeterminadas
    this.registerDefaultStrategies();
  }

  /**
   * Registra las estrategias predeterminadas
   */
  private registerDefaultStrategies(): void {
    // Registrar únicamente la estrategia para Mongoose como fuente de verdad
    this.strategies.push(new MongooseAnalysisStrategy());
  }

  /**
   * Registra una nueva estrategia
   */
  public registerStrategy(strategy: ModelAnalysisStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Analiza un modelo utilizando la estrategia adecuada
   */
  public analyzeModel(modelName: string, modelContent: string): ModelStructure {
    // Encontrar la primera estrategia que puede analizar este modelo
    for (const strategy of this.strategies) {
      if (strategy.canAnalyze(modelName, modelContent)) {
        // Analyzing model with strategy
        return strategy.analyze(modelName, modelContent);
      }
    }

    // Si no se encontró ninguna estrategia, devolver una estructura básica
    // eslint-disable-next-line no-console
    console.warn(`No se encontró una estrategia para analizar el modelo ${modelName}`);
    return {
      name: modelName,
      fields: [],
      references: [],
      enums: {}
    };
  }
} 