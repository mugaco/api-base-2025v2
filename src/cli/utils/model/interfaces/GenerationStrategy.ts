/**
 * Interfaces para estrategias de generación de datos
 *
 * Este archivo define las interfaces para implementar estrategias
 * de generación de datos para diferentes tipos de campos
 */

import { FieldDefinition, ModelStructure } from './AnalysisStrategy';
import type { Faker } from '@faker-js/faker';

/**
 * Contexto para la generación de un valor
 */
export interface GenerationContext {
  index: number;
  realistic: boolean;
  modelName: string;
  modelStructure: ModelStructure;
  customValues: Record<string, unknown>;
  faker: Faker;
}

/**
 * Interfaz para implementar estrategias de generación de valores
 */
export interface ValueGenerationStrategy {
  /**
   * Nombre identificativo de la estrategia
   */
  readonly name: string;
  
  /**
   * Prioridad de la estrategia (mayor número = mayor prioridad)
   */
  readonly priority: number;
  
  /**
   * Determina si esta estrategia puede generar un valor para este campo
   */
  canGenerate(field: FieldDefinition, context: GenerationContext): boolean;
  
  /**
   * Genera un valor para el campo
   */
  generateValue(field: FieldDefinition, context: GenerationContext): unknown;
} 