/**
 * Analizador de archivos DTO
 * Extrae información de clases DTO y sus validaciones
 */
import fs from 'fs';
import { FileUtils } from './FileUtils';

export interface PropertyDefinition {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  validations: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  options?: any;
  message?: string;
}

export interface DtoDefinition {
  name: string;
  description?: string;
  properties: PropertyDefinition[];
}

export class DtoAnalyzer {
  /**
   * Analiza un archivo DTO para extraer definiciones y validaciones
   */
  static async analyze(dtoFilePath: string): Promise<DtoDefinition[]> {
    try {
      // Leer el archivo DTO
      const content = await fs.promises.readFile(dtoFilePath, 'utf8');
      
      // Extraer las clases DTO
      const dtoClasses: DtoDefinition[] = [];
      
      // Buscar todas las clases exportadas
      const classRegex = /export\s+class\s+(\w+)DTO\s*{([^}]*)}/gs;
      let classMatch;
      
      while ((classMatch = classRegex.exec(content)) !== null) {
        const className = classMatch[1];
        const classContent = classMatch[2];
        
        // Extraer descripción de la clase
        const description = this.extractClassDescription(content, classMatch.index);
        
        // Extraer propiedades y sus validaciones
        const properties = this.extractProperties(classContent);
        
        dtoClasses.push({
          name: `${className}DTO`,
          description,
          properties
        });
      }
      
      return dtoClasses;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error analizando DTO:`, error);
      throw error;
    }
  }
  
  /**
   * Extrae la descripción de una clase de los comentarios JSDoc
   */
  private static extractClassDescription(content: string, classPosition: number): string | undefined {
    // Buscar el comentario más cercano antes de la posición de la clase
    const contentBeforeClass = content.substring(0, classPosition);
    
    // Buscar el último comentario JSDoc antes de la posición
    const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
    
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    
    while ((match = jsdocRegex.exec(contentBeforeClass)) !== null) {
      lastMatch = match;
    }
    
    if (lastMatch && lastMatch[1]) {
      // Limpiar el comentario JSDoc
      return lastMatch[1]
        .replace(/\s*\*\s*/g, ' ')
        .trim();
    }
    
    return undefined;
  }
  
  /**
   * Extrae propiedades y sus validaciones desde el contenido de la clase
   */
  private static extractProperties(classContent: string): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    
    // Dividir el contenido por declaraciones de propiedades
    const propertyBlocks = classContent.split(/\s*[?]?\s*;\s*/);
    
    for (let i = 0; i < propertyBlocks.length; i++) {
      const block = propertyBlocks[i].trim();
      if (!block) continue;
      
      // Buscar decoradores y propiedad
      const decorators = this.extractDecorators(block);
      const propertyMatch = /@\w+(?:\([^)]*\))?\s*\r?\n\s*(\w+)(?:\?)?:\s*([^;]*)/s.exec(block);
      
      if (!propertyMatch) continue;
      
      const name = propertyMatch[1];
      const type = propertyMatch[2].trim();
      
      // Determinar si es requerido basado en decoradores
      const isRequired = decorators.some(d => d.type === 'IsNotEmpty' || d.type === 'IsRequired');
      
      // Crear la definición de propiedad
      properties.push({
        name,
        type: this.simplifyType(type),
        required: isRequired,
        validations: decorators
      });
    }
    
    return properties;
  }
  
  /**
   * Extrae decoradores desde un bloque de código
   */
  private static extractDecorators(block: string): ValidationRule[] {
    const decorators: ValidationRule[] = [];
    const decoratorRegex = /@(\w+)(?:\(([^)]*)\))?/g;
    
    let match: RegExpExecArray | null;
    while ((match = decoratorRegex.exec(block)) !== null) {
      const type = match[1];
      let options: any = undefined;
      
      // Intentar parsear las opciones si existen
      if (match[2]) {
        try {
          // Para opciones simples, como números o strings
          if (/^\d+$/.test(match[2])) {
            options = parseInt(match[2], 10);
          } else if (/^'[^']*'$/.test(match[2]) || /^"[^"]*"$/.test(match[2])) {
            options = match[2].substring(1, match[2].length - 1);
          } else if (/^{.*}$/.test(match[2])) {
            // Para objetos, usamos una solución simple por ahora
            options = { complexObject: true };
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Error parsing decorator options: ${e}`);
        }
      }
      
      decorators.push({
        type,
        options
      });
    }
    
    return decorators;
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
    
    // Manejar arreglos
    if (type.endsWith('[]') || type.startsWith('Array<')) return 'array';
    
    // Manejar objetos
    if (type.includes('object') || type.includes('Object') || type.includes('Record<')) return 'object';
    
    return type;
  }
  
  /**
   * Mapea decoradores de class-validator a formatos OpenAPI
   */
  static mapValidationToOpenApi(validations: ValidationRule[]): Record<string, any> {
    const openApiValidation: Record<string, any> = {};
    
    for (const validation of validations) {
      switch (validation.type) {
        case 'IsOptional':
          // Las opcionales se manejan en otro lado
          break;
        case 'IsNotEmpty':
        case 'IsRequired':
          openApiValidation.required = true;
          break;
        case 'MinLength':
          openApiValidation.minLength = validation.options;
          break;
        case 'MaxLength':
          openApiValidation.maxLength = validation.options;
          break;
        case 'Min':
          openApiValidation.minimum = validation.options;
          break;
        case 'Max':
          openApiValidation.maximum = validation.options;
          break;
        case 'IsEmail':
          openApiValidation.format = 'email';
          break;
        case 'IsDate':
          openApiValidation.format = 'date-time';
          break;
        case 'IsIn':
          // Normalmente esto tendría un array de valores permitidos
          if (Array.isArray(validation.options)) {
            openApiValidation.enum = validation.options;
          }
          break;
        case 'IsUrl':
          openApiValidation.format = 'uri';
          break;
        case 'IsUUID':
          openApiValidation.format = 'uuid';
          break;
        case 'Matches':
          if (validation.options) {
            openApiValidation.pattern = validation.options;
          }
          break;
      }
    }
    
    return openApiValidation;
  }
} 