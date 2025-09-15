/**
 * Analizador de archivos de modelo
 * Extrae información de los modelos y esquemas definidos
 */
import fs from 'fs';
import { FileUtils } from './FileUtils';

export interface FieldDefinition {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  ref?: string;
  enum?: string[];
  min?: number;
  max?: number;
  default?: any;
  pattern?: string;
  format?: string;
  isArray?: boolean;
  arrayItemType?: string;
  isNested?: boolean;
  nestedFields?: FieldDefinition[];
}

export interface SchemaDefinition {
  fields: SchemaFieldDefinition[];
  options?: Record<string, any>;
}

export interface SchemaFieldDefinition {
  name: string;
  config: Record<string, any>;
}

export interface ModelDefinition {
  name: string;
  description?: string;
  fields: FieldDefinition[];
  timestamps?: boolean;
  schemaDefinition?: SchemaDefinition;
}

export class ModelAnalyzer {
  /**
   * Analiza un archivo de modelo para extraer definición de campos
   */
  static async analyze(modelFilePath: string): Promise<ModelDefinition> {
    try {
      // Leer el archivo del modelo
      const content = await fs.promises.readFile(modelFilePath, 'utf8');
      
      // Extraer nombre y descripción del modelo
      const modelName = this.extractModelName(content);
      const modelDescription = this.extractModelDescription(content);
      
      // Extraer definición de interfaz
      const interfaceFields = this.extractInterfaceFields(content);
      
      // Extraer definición de esquema
      const schemaDefinition = this.extractSchemaDefinition(content);
      
      // Determinar si el modelo tiene timestamps
      const hasTimestamps = this.detectTimestamps(content);
      
      return {
        name: modelName,
        description: modelDescription,
        fields: interfaceFields,
        timestamps: hasTimestamps,
        schemaDefinition
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error analizando modelo:`, error);
      throw error;
    }
  }
  
  /**
   * Extrae el nombre del modelo
   */
  private static extractModelName(content: string): string {
    // Buscar patrón de exportación de interfaz
    const interfaceMatch = /export\s+interface\s+I(\w+)\s+extends\s+Document/i.exec(content);
    
    if (interfaceMatch && interfaceMatch[1]) {
      return interfaceMatch[1];
    }
    
    // Buscar patrón de exportación de modelo
    const modelMatch = /export\s+const\s+(\w+Model)/i.exec(content);
    
    if (modelMatch && modelMatch[1]) {
      return modelMatch[1].replace('Model', '');
    }
    
    // Fallback: usar el nombre del archivo
    return 'UnknownModel';
  }
  
  /**
   * Extrae la descripción del modelo de los comentarios JSDoc
   */
  private static extractModelDescription(content: string): string {
    // Buscar comentario JSDoc al principio del archivo
    const jsdocMatch = /\/\*\*\s*([\s\S]*?)\s*\*\//.exec(content);
    
    if (jsdocMatch && jsdocMatch[1]) {
      // Limpiar el comentario JSDoc
      return jsdocMatch[1]
        .replace(/\s*\*\s*/g, ' ')
        .replace(/Modelo para/, '')
        .trim();
    }
    
    return '';
  }
  
  /**
   * Extrae los campos de la interfaz y sus metadatos
   */
  private static extractInterfaceFields(content: string): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    
    // Extraer bloque de interfaz
    const interfaceMatch = /export\s+interface\s+I\w+\s+extends\s+Document\s*{([^}]*)}/s.exec(content);
    
    if (!interfaceMatch || !interfaceMatch[1]) {
      return fields;
    }
    
    const interfaceContent = interfaceMatch[1];
    
    // Dividir por definiciones de campo
    const fieldBlocks = interfaceContent.split(/\s*;(?=\s*\/\*\*|\s*\w+\s*:|\s*$)/);
    
    for (const block of fieldBlocks) {
      if (!block.trim()) continue;
      
      // Extraer nombre y tipo
      const fieldMatch = /(\w+)\s*:\s*([^;]*)/s.exec(block);
      
      if (!fieldMatch) continue;
      
      const name = fieldMatch[1];
      let type = this.cleanupType(fieldMatch[2]);
      
      // Determinar si es requerido
      const isRequired = !block.includes('?:');
      
      // Extraer descripción de JSDoc
      const description = this.extractJSDocDescription(block);
      
      // Detectar si es un arreglo
      const isArray = type.endsWith('[]') || type.startsWith('Array<');
      
      // Detectar tipo de elemento de array
      let arrayItemType = undefined;
      
      if (isArray) {
        if (type.endsWith('[]')) {
          arrayItemType = type.substring(0, type.length - 2);
        } else {
          const arrayMatch = /Array<([^>]+)>/.exec(type);
          if (arrayMatch) {
            arrayItemType = arrayMatch[1];
          }
        }
      }
      
      // Detectar referencia a otro modelo
      let ref = undefined;
      
      if (type.includes('ObjectId') || type.includes('mongoose.Types.ObjectId') || type.includes('Document')) {
        const refMatch = /ref:\s*['"](\w+)['"]/.exec(content);
        if (refMatch) {
          ref = refMatch[1];
        }
      }
      
      // Añadir campo a la lista
      fields.push({
        name,
        type: this.simplifyType(type),
        description,
        required: isRequired,
        ref,
        isArray,
        arrayItemType: isArray ? this.simplifyType(arrayItemType || '') : undefined
      });
    }
    
    return fields;
  }
  
  /**
   * Extrae la descripción de un campo desde su bloque JSDoc
   */
  private static extractJSDocDescription(fieldBlock: string): string | undefined {
    const jsdocMatch = /\/\*\*\s*([\s\S]*?)\s*\*\//.exec(fieldBlock);
    
    if (jsdocMatch && jsdocMatch[1]) {
      // Limpiar el comentario JSDoc
      return jsdocMatch[1]
        .replace(/\s*\*\s*/g, ' ')
        .trim();
    }
    
    return undefined;
  }
  
  /**
   * Extrae la definición del esquema Mongoose
   */
  private static extractSchemaDefinition(content: string): SchemaDefinition | undefined {
    // Buscar la definición del esquema
    const schemaMatch = /const\s+\w+Schema\s*=\s*new\s+Schema<[^>]*>\s*\(\s*{([^}]*)}\s*,\s*({[^}]*})?\s*\)/s.exec(content);
    
    if (!schemaMatch) {
      return undefined;
    }
    
    const schemaFields: SchemaFieldDefinition[] = [];
    const fieldDefinitions = schemaMatch[1];
    
    // Dividir por campos separados por coma
    const fieldBlocks = fieldDefinitions.split(/,(?=\s*\w+\s*:)/g);
    
    for (const block of fieldBlocks) {
      // Extraer nombre y configuración del campo
      const fieldMatch = /(\w+)\s*:\s*({[^}]*})/s.exec(block);
      
      if (!fieldMatch) continue;
      
      const name = fieldMatch[1];
      const config = this.parseFieldConfig(fieldMatch[2]);
      
      schemaFields.push({
        name,
        config
      });
    }
    
    // Extraer opciones de esquema
    let options = {};
    
    if (schemaMatch[2]) {
      try {
        // Convertir string de opciones a objeto
        options = this.parseSchemaOptions(schemaMatch[2]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error parsing schema options:', error);
      }
    }
    
    return {
      fields: schemaFields,
      options
    };
  }
  
  /**
   * Convierte un string de configuración de campo a un objeto
   */
  private static parseFieldConfig(configStr: string): Record<string, any> {
    // Simplificación: extraer pares clave-valor básicos
    const config: Record<string, any> = {};
    
    // Extraer tipo
    const typeMatch = /type\s*:\s*(String|Number|Boolean|Date|Schema\.Types\.ObjectId|Array|Object|Schema\.Types\.Mixed)/i.exec(configStr);
    if (typeMatch) {
      config.type = typeMatch[1];
    }
    
    // Extraer required
    const requiredMatch = /required\s*:\s*(true|false)/i.exec(configStr);
    if (requiredMatch) {
      config.required = requiredMatch[1] === 'true';
    }
    
    // Extraer min/max
    const minMatch = /min\s*:\s*(\d+)/i.exec(configStr);
    if (minMatch) {
      config.min = parseInt(minMatch[1], 10);
    }
    
    const maxMatch = /max\s*:\s*(\d+)/i.exec(configStr);
    if (maxMatch) {
      config.max = parseInt(maxMatch[1], 10);
    }
    
    // Extraer unique
    const uniqueMatch = /unique\s*:\s*(true|false)/i.exec(configStr);
    if (uniqueMatch) {
      config.unique = uniqueMatch[1] === 'true';
    }
    
    // Extraer referencia
    const refMatch = /ref\s*:\s*['"](\w+)['"]/i.exec(configStr);
    if (refMatch) {
      config.ref = refMatch[1];
    }
    
    // Extraer enum
    const enumMatch = /enum\s*:\s*\[(.*?)\]/i.exec(configStr);
    if (enumMatch) {
      config.enum = enumMatch[1]
        .split(',')
        .map(item => item.trim().replace(/['"]/g, ''));
    }
    
    return config;
  }
  
  /**
   * Convierte un string de opciones de esquema a un objeto
   */
  private static parseSchemaOptions(optionsStr: string): Record<string, any> {
    const options: Record<string, any> = {};
    
    // Extraer timestamps
    const timestampsMatch = /timestamps\s*:\s*(true|false)/i.exec(optionsStr);
    if (timestampsMatch) {
      options.timestamps = timestampsMatch[1] === 'true';
    }
    
    return options;
  }
  
  /**
   * Detecta si el esquema tiene timestamps habilitados
   */
  private static detectTimestamps(content: string): boolean {
    return /timestamps\s*:\s*true/i.test(content);
  }
  
  /**
   * Simplifica el tipo para hacerlo más genérico
   */
  private static simplifyType(type: string): string {
    if (!type) return 'any';
    
    type = type.trim();
    
    // Manejar tipos básicos
    if (type.includes('string') || type.includes('String')) return 'string';
    if (type.includes('number') || type.includes('Number')) return 'number';
    if (type.includes('boolean') || type.includes('Boolean')) return 'boolean';
    if (type.includes('Date')) return 'date';
    
    // Manejar ObjectId
    if (type.includes('ObjectId') || type.includes('mongoose.Types.ObjectId')) return 'objectid';
    
    // Manejar arreglos
    if (type.endsWith('[]') || type.startsWith('Array<')) return 'array';
    
    // Manejar objetos
    if (type.includes('object') || type.includes('Object') || type.includes('Record<')) return 'object';
    
    return type;
  }
  
  /**
   * Limpia un tipo eliminando espacios extra, importaciones, etc.
   */
  private static cleanupType(type: string): string {
    return type
      .replace(/\s+/g, ' ')
      .trim();
  }
} 