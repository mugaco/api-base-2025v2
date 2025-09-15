/**
 * Estrategia de análisis para modelos de Mongoose
 */
import { ModelAnalysisStrategy, ModelStructure, FieldDefinition, ReferenceDefinition } from '../../interfaces/AnalysisStrategy';

export class MongooseAnalysisStrategy implements ModelAnalysisStrategy {
  /**
   * Verifica si puede analizar este contenido de modelo (si contiene patrones de Mongoose)
   */
  canAnalyze(modelName: string, modelContent: string): boolean {
    return (
      modelContent.includes('mongoose') &&
      (modelContent.includes('new Schema') || modelContent.includes('new mongoose.Schema'))
    );
  }

  /**
   * Analiza el contenido del modelo y extrae su estructura
   */
  analyze(modelName: string, modelContent: string): ModelStructure {
    try {
      // Inicializar estructura del modelo
      const modelStructure: ModelStructure = {
        name: modelName,
        fields: [],
        references: [],
        enums: {},
      };

      // eslint-disable-next-line no-console
      // Analyzing model with Mongoose strategy

      // Primero intentamos extraer de la interfaz de TypeScript si existe
      this.extractFromInterface(modelContent, modelStructure);

      // Si no se encontraron campos en la interfaz, extraer del esquema
      if (modelStructure.fields.length === 0) {
        // eslint-disable-next-line no-console
        // Extracting fields from schema
        this.extractFromSchema(modelContent, modelStructure);
      }

      // Si aún no hay campos, intentar extraer de definiciones simplificadas
      if (modelStructure.fields.length === 0) {
        // eslint-disable-next-line no-console
        // Trying to extract from simplified definitions
        this.extractFromSimplifiedSchema(modelContent, modelStructure);
      }

      // eslint-disable-next-line no-console
      // Fields found
      for (const field of modelStructure.fields) {
        // eslint-disable-next-line no-console
        // Field details logged
      }

      return modelStructure;
    } catch (error) {
      // eslint-disable-next-line no-console
      // eslint-disable-next-line no-console
      console.error(`Error al analizar el modelo ${modelName} con estrategia Mongoose:`, error);
      // Devolver una estructura básica en caso de error
      return {
        name: modelName,
        fields: [],
        references: [],
        enums: {},
      };
    }
  }

  /**
   * Extrae campos de la interfaz TypeScript
   */
  private extractFromInterface(modelContent: string, modelStructure: ModelStructure): void {
    // Buscar la definición de la interfaz
    const interfaceMatch = modelContent.match(/export\s+interface\s+I([a-zA-Z0-9_]+)\s+extends\s+Document\s+{([^}]+)}/s);
    
    if (!interfaceMatch) return;
    
    const interfaceContent = interfaceMatch[2];
    
    // Extraer campos y sus tipos
    const fieldMatches = Array.from(interfaceContent.matchAll(/(\w+)(\?)?:\s*([^;]+);/g));
    
    for (const match of fieldMatches) {
      const fieldName = match[1];
      const isOptional = !!match[2];
      const fieldType = match[3].trim();
      
      // Detectar si es una referencia a otro modelo
      const isReference = fieldType.includes('Types.ObjectId');
      const isArray = fieldType.includes('[') && fieldType.includes(']');
      
      // Mapear el tipo TypeScript a un tipo simple
      const simpleType = this.mapTypeToSimpleType(fieldType);
      
      const field: FieldDefinition = {
        name: fieldName,
        type: simpleType,
        required: !isOptional,
        isReference,
        isArray
      };
      
      modelStructure.fields.push(field);
      
      // Si es una referencia, extraer el modelo referenciado del esquema
      if (isReference) {
        this.extractReferenceFromSchema(modelContent, fieldName, isArray, modelStructure);
      }
    }
    
    // Extraer enumeraciones si existen
    this.extractEnumsFromContent(modelContent, modelStructure);
  }

  /**
   * Extrae campos del esquema de Mongoose
   */
  private extractFromSchema(modelContent: string, modelStructure: ModelStructure): void {
    // Buscar la definición del esquema - más tolerante con espacios y saltos de línea
    const schemaMatch = modelContent.match(/new\s+(?:mongoose\.)?Schema(?:<.*?>)?\s*\(\s*(\{[^]*?\})\s*,\s*\{/s);
    
    if (!schemaMatch) {
      // eslint-disable-next-line no-console
      // Schema definition not found
      return;
    }
    
    const schemaContent = schemaMatch[1];
    // eslint-disable-next-line no-console
    // Schema content found
    
    // Expresión regular mejorada para ser más tolerante con espacios y comentarios
    // Esta regex busca pares de nombre:valor dentro del esquema
    const fieldRegex = /(\w+)\s*:\s*({[^}]*}|[^,}]*)/gs;
    const matches = Array.from(schemaContent.matchAll(fieldRegex));
    
    if (matches.length === 0) {
      // No fields found with main regex
    }
    
    for (const match of matches) {
      const fieldName = match[1].trim();
      let fieldContent = match[2].trim();
      
      // Ignora campos especiales como __v
      if (fieldName === '__v') continue;
      
      // Ignora campos marcados como select: false si son campos de borrado lógico
      if ((fieldName === 'isDeleted' || fieldName === 'deletedAt') && 
          fieldContent.includes('select: false')) {
        continue;
      }
      
      // eslint-disable-next-line no-console
      // Processing field
      
      // Extraer tipo y si es requerido
      let fieldType = 'string'; // Tipo por defecto
      let isRequired = false;
      let isReference = false;
      let isArray = false;
      let refModel = '';
      
      // Verificar si el campo es un objeto con definición detallada o un tipo simple
      if (fieldContent.startsWith('{')) {
        // Es un objeto de definición detallada
        // Buscar el tipo
        const typeMatch = fieldContent.match(/type\s*:\s*(?:Schema\.Types\.|mongoose\.Schema\.Types\.)?(\w+|\[.*?\])/s);
        if (typeMatch) {
          let typeStr = typeMatch[1];
          
          // Detectar si es un array
          if (typeStr.startsWith('[') && typeStr.endsWith(']')) {
            isArray = true;
            typeStr = typeStr.substring(1, typeStr.length - 1).trim();
          }
          
          // Mapear el tipo
          switch (typeStr) {
            case 'String': fieldType = 'string'; break;
            case 'Number': fieldType = 'number'; break;
            case 'Boolean': fieldType = 'boolean'; break;
            case 'Date': fieldType = 'date'; break;
            case 'Mixed': fieldType = 'object'; break;
            case 'ObjectId': 
              fieldType = 'objectid';
              isReference = true;
              break;
          }
        }
        
        // Verificar si es requerido
        isRequired = /required\s*:\s*true/.test(fieldContent);
        
        // Verificar si es una referencia
        const refMatch = fieldContent.match(/ref\s*:\s*['"]([^'"]+)['"]/);
        if (refMatch) {
          isReference = true;
          refModel = refMatch[1];
        }
      } else {
        // Es una definición simplificada (ej: fieldName: String)
        switch (fieldContent) {
          case 'String': fieldType = 'string'; break;
          case 'Number': fieldType = 'number'; break;
          case 'Boolean': fieldType = 'boolean'; break;
          case 'Date': fieldType = 'date'; break;
          case 'Schema.Types.ObjectId':
          case 'mongoose.Schema.Types.ObjectId':
            fieldType = 'objectid';
            isReference = true;
            break;
        }
      }
      
      // Crear el objeto de campo
      const field: FieldDefinition = {
        name: fieldName,
        type: fieldType,
        required: isRequired,
        isReference,
        isArray
      };
      
      // Añadir a la estructura
      modelStructure.fields.push(field);
      
      // Si es una referencia, añadir a las referencias
      if (isReference && refModel) {
        const reference: ReferenceDefinition = {
          field: fieldName,
          model: refModel,
          isArray
        };
        modelStructure.references.push(reference);
        field.ref = refModel;
      }
    }
  }

  /**
   * Extrae campos de un esquema simplificado de Mongoose
   */
  private extractFromSimplifiedSchema(modelContent: string, modelStructure: ModelStructure): void {
    // Buscar definiciones simplificadas como strings, numbers, etc.
    const shortPropsRegex = /(\w+):\s*(String|Number|Boolean|Date|Mixed|\[.*?\])/g;
    const shortPropMatches = Array.from(modelContent.matchAll(shortPropsRegex));
    
    for (const match of shortPropMatches) {
      const fieldName = match[1];
      const typeDef = match[2];
      
      // Mapear el tipo
      let fieldType = 'string';
      if (typeDef === 'String') fieldType = 'string';
      else if (typeDef === 'Number') fieldType = 'number';
      else if (typeDef === 'Boolean') fieldType = 'boolean';
      else if (typeDef === 'Date') fieldType = 'date';
      else if (typeDef === 'Mixed') fieldType = 'object';
      
      // Determinar si es un array
      const isArray = typeDef.startsWith('[');
      if (isArray) {
        // Extraer el tipo del array
        const arrayTypeMatch = typeDef.match(/\[(.*?)\]/);
        if (arrayTypeMatch) {
          const arrayType = arrayTypeMatch[1].trim();
          if (arrayType === 'String') fieldType = 'string';
          else if (arrayType === 'Number') fieldType = 'number';
          else if (arrayType === 'Boolean') fieldType = 'boolean';
          else if (arrayType === 'Date') fieldType = 'date';
          else if (arrayType === 'Mixed') fieldType = 'object';
          else if (arrayType.includes('ObjectId')) fieldType = 'objectid';
        }
      }
      
      // Determinar si es una referencia
      const isReference = typeDef.includes('ObjectId');
      
      // Crear el objeto de campo
      const field: FieldDefinition = {
        name: fieldName,
        type: fieldType,
        required: false, // Por defecto, no requerido para sintaxis corta
        isReference,
        isArray
      };
      
      modelStructure.fields.push(field);
      
      // Si es una referencia, intentar extraer el modelo referenciado
      if (isReference) {
        this.extractReferenceFromSchema(modelContent, fieldName, isArray, modelStructure);
      }
    }
  }

  /**
   * Extrae referencia a otro modelo buscando en el esquema
   */
  private extractReferenceFromSchema(modelContent: string, fieldName: string, isArray: boolean, modelStructure: ModelStructure): void {
    const refMatch = modelContent.match(new RegExp(`${fieldName}:\\s*{[^}]*ref:\\s*['"]([^'"]+)['"]`, 's'));
    
    if (refMatch) {
      const referencedModel = refMatch[1];
      const reference: ReferenceDefinition = {
        field: fieldName,
        model: referencedModel,
        isArray
      };
      modelStructure.references.push(reference);
      
      // Actualizar la información de referencia en el campo correspondiente
      const field = modelStructure.fields.find(f => f.name === fieldName);
      if (field) {
        field.ref = referencedModel;
      }
    }
  }

  /**
   * Extrae valores enum del contenido
   */
  private extractEnumsFromContent(modelContent: string, modelStructure: ModelStructure): void {
    // Buscar enums en el esquema
    const schemaEnumMatches = modelContent.matchAll(/(\w+):\s*{[^}]*enum:\s*\[(.*?)\]/gs);
    
    for (const match of Array.from(schemaEnumMatches)) {
      const fieldName = match[1];
      const enumValuesString = match[2];
      
      // Extraer valores del array enum
      const enumValues = enumValuesString.match(/["']([^"']+)["']/g)?.map(v => v.replace(/["']/g, '')) || [];
      
      if (enumValues.length > 0) {
        modelStructure.enums[fieldName] = enumValues;
        
        // Actualizar la información de enum en el campo correspondiente
        const field = modelStructure.fields.find(f => f.name === fieldName);
        if (field) {
          field.isEnum = true;
          field.enumValues = enumValues;
        }
      }
    }
  }

  /**
   * Mapea un tipo TypeScript a un tipo simple
   */
  private mapTypeToSimpleType(typeString: string): string {
    if (typeString.includes('string') || typeString.includes('String')) {
      return 'string';
    } else if (typeString.includes('number') || typeString.includes('Number')) {
      return 'number';
    } else if (typeString.includes('boolean') || typeString.includes('Boolean')) {
      return 'boolean';
    } else if (typeString.includes('Date')) {
      return 'date';
    } else if (typeString.includes('ObjectId')) {
      return 'objectid';
    } else if (typeString.includes('[') && typeString.includes(']')) {
      return 'array';
    } else if (typeString.includes('{}') || typeString.includes('object') || typeString.includes('Record')) {
      return 'object';
    }
    
    return 'string'; // Por defecto
  }
} 