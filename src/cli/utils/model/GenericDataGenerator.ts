/**
 * Generador de datos genérico
 * 
 * Esta clase se encarga de generar datos para cualquier modelo
 * utilizando la estructura extraída de los modelos Mongoose
 * y las estrategias de generación registradas.
 */
import mongoose from 'mongoose';
import { ModelStructure, FieldDefinition } from './interfaces/AnalysisStrategy';
import { GenerationContext } from './interfaces/GenerationStrategy';
import { GenerationStrategyRegistry } from './GenerationStrategyRegistry';

export class GenericDataGenerator {
  constructor(
    private readonly strategyRegistry: GenerationStrategyRegistry,
    private readonly faker: any
  ) {}

  /**
   * Genera un registro completo basado en la estructura del modelo
   */
  public async generateRecord(
    modelStructure: ModelStructure,
    index: number,
    realistic: boolean,
    customValues: Record<string, any> = {}
  ): Promise<any> {
    // Validar la estructura del modelo
    if (!modelStructure || !modelStructure.fields || !Array.isArray(modelStructure.fields)) {
      // eslint-disable-next-line no-console
      console.warn(`Estructura de modelo inválida: ${JSON.stringify(modelStructure).substring(0, 100)}...`);
      
      // Devolver un objeto con ID y timestamps como mínimo
      return {
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        __warning: "Estructura de modelo incompleta, datos parciales generados"
      };
    }
    
    // Si no hay campos definidos, crear un objeto básico
    if (modelStructure.fields.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(`El modelo ${modelStructure.name} no tiene campos definidos. Usando objeto básico.`);
      return {
        _id: new mongoose.Types.ObjectId(),
        name: `${modelStructure.name}_${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Crear el contexto de generación
    const context: GenerationContext = {
      index,
      realistic,
      modelName: modelStructure.name,
      modelStructure,
      customValues,
      faker: this.faker
    };
    
    // Crear registro base con ID
    const record: Record<string, any> = {
      _id: new mongoose.Types.ObjectId()
    };
    
    // Generating record for model
    
    // Generar valores para cada campo
    for (const field of modelStructure.fields) {
      // Omitir campos especiales que se manejan de otra forma
      if (field.name === '_id' || field.name === '__v' || field.name === 'createdAt' || field.name === 'updatedAt' ||
          field.name === 'isDeleted' || field.name === 'deletedAt') {
        continue;
      }
      
      // Processing field
      
      // Generar valor usando el registro de estrategias
      record[field.name] = this.strategyRegistry.generateValue(field, context);
    }
    
    // Añadir timestamps
    const now = new Date();
    record.createdAt = now;
    record.updatedAt = now;
    
    return record;
  }

  /**
   * Genera múltiples registros para un modelo
   */
  public async generateRecords(
    modelStructure: ModelStructure,
    count: number,
    realistic: boolean,
    customValues: Record<string, any> = {}
  ): Promise<any[]> {
    const records = [];
    
    for (let i = 0; i < count; i++) {
      const record = await this.generateRecord(modelStructure, i, realistic, customValues);
      records.push(record);
    }
    
    return records;
  }
} 