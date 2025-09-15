/**
 * Interfaces para estrategias de análisis de modelos
 * 
 * Este archivo define las interfaces para implementar estrategias
 * de análisis de diferentes tipos de modelos (Mongoose, Zod, TypeScript, etc.)
 */

/**
 * Representa la estructura de un campo en un modelo
 */
export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  isReference: boolean;
  isEnum?: boolean;
  enumValues?: string[];
  isArray?: boolean;
  ref?: string;
  description?: string;
  meta?: Record<string, unknown>;
}

/**
 * Representa una referencia a otro modelo
 */
export interface ReferenceDefinition {
  field: string;
  model: string;
  isArray: boolean;
}

/**
 * Estructura completa de un modelo analizado
 */
export interface ModelStructure {
  name: string;
  fields: FieldDefinition[];
  references: ReferenceDefinition[];
  enums: Record<string, string[]>;
  meta?: Record<string, unknown>;
}

/**
 * Interfaz para implementar estrategias de análisis de modelos
 */
export interface ModelAnalysisStrategy {
  /**
   * Determina si esta estrategia puede manejar esta definición de modelo
   */
  canAnalyze(modelName: string, modelContent: string): boolean;
  
  /**
   * Analiza el contenido del modelo y extrae su estructura
   */
  analyze(modelName: string, modelContent: string): ModelStructure;
} 