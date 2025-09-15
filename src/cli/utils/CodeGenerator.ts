/**
 * Generador de código para recursos
 */
import path from 'path';
import Handlebars from 'handlebars';
import { FileUtils } from './FileUtils';
import { StringUtils } from './StringUtils';
import { DataSource, Field, Templates, Specs, JavaScriptType, MongooseType } from '../interfaces/DataSourceInterfaces';
import mongoose from 'mongoose';

export class CodeGenerator {
  private templates: Templates = {
    controller: 'Controller.hbs',
    service: 'Service.hbs',
    repository: 'Repository.hbs',
    model: 'Model.hbs',
    dto: 'Dto.hbs',
    routes: 'Routes.hbs'
  };

  /**
   * Constructor
   */
  constructor() {
    this.registerHandlebarsHelpers();
  }

  /**
   * Registra helpers personalizados para Handlebars
   */
  private registerHandlebarsHelpers(): void {
    // Configurar Handlebars para usar las opciones noEscape
    Handlebars.registerHelper('noEscape', function(text) {
      return new Handlebars.SafeString(text);
    });

    Handlebars.registerHelper('toLowerCase', function(str) {
      return str.toLowerCase();
    });

    Handlebars.registerHelper('toUpperCase', function(str) {
      return str.toUpperCase();
    });

    Handlebars.registerHelper('toCamelCase', function(str) {
      return StringUtils.toCamelCase(str);
    });

    Handlebars.registerHelper('toPascalCase', function(str) {
      return StringUtils.toPascalCase(str);
    });

    Handlebars.registerHelper('pluralize', function(str) {
      return StringUtils.pluralize(str);
    });

    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    Handlebars.registerHelper('neq', function(a, b) {
      return a !== b;
    });

    Handlebars.registerHelper('and', function(a, b) {
      return a && b;
    });

    Handlebars.registerHelper('or', function(a, b) {
      return a || b;
    });

    Handlebars.registerHelper('contains', function(array, value) {
      return Array.isArray(array) && array.includes(value);
    });
  }

  /**
   * Mapea un tipo JavaScript a un tipo Mongoose
   */
  private mapJsTypeToMongooseType(type: JavaScriptType): MongooseType {
    const typeMapping: Record<JavaScriptType, MongooseType> = {
      'string': 'String',
      'email': 'String',
      'number': 'Number',
      'integer': 'Number',
      'boolean': 'Boolean',
      'date': 'Date',
      'array': 'Array',
      'object': 'Object',
      'objectid': 'Schema.Types.ObjectId',
      'schema': 'Schema.Types.Mixed' // Los subdocumentos se manejan de forma especial
    };

    return typeMapping[type] || 'Schema.Types.Mixed';
  }

  /**
   * Obtiene la definición de esquema para un subdocumento
   */
  private getSubdocumentSchema(schemaRef: string): DataSource | null {
    try {
      const { schemasDir } = FileUtils.getProjectPaths();
      const schemaPath = path.join(schemasDir, `${schemaRef}.json`);
      return FileUtils.readJsonFile<DataSource>(schemaPath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error al cargar el esquema ${schemaRef} como subdocumento:`, error);
      return null;
    }
  }

  /**
   * Genera definiciones de campos para el esquema Mongoose
   */
  private generateMongooseSchemaFields(fields: Field[]): string {
    return fields.map(field => {
      // Si es un subdocumento, manejarlo de forma especial
      if (field.type === 'schema' && field.schemaRef) {
        const subSchema = this.getSubdocumentSchema(field.schemaRef);
        if (subSchema) {
          let fieldDefinition = `${field.name}: { 
        type: new mongoose.Schema({
          ${this.generateMongooseSchemaFields(subSchema.fields)}
        }, { _id: false })`; // Generalmente, los subdocumentos no tienen _id propio
          
          if (field.required) {
            fieldDefinition += `,
        required: true`;
          }
          
          fieldDefinition += `
      }`;
          
          return fieldDefinition;
        }
      }
      
      // Para arrays con elementos tipo schema
      if (field.type === 'array' && typeof field.items === 'object' && field.items.type === 'schema' && field.items.schemaRef) {
        const subSchema = this.getSubdocumentSchema(field.items.schemaRef);
        if (subSchema) {
          const innerFields = this.generateMongooseSchemaFields(subSchema.fields)
            .split('\n')
            .map(line => `          ${line}`)
            .join('\n');
            
          let fieldDefinition = `${field.name}: [{ 
        type: new mongoose.Schema({
${innerFields}
        }, { _id: false }) // Subdocumento dentro de array
      }]`;
          
          return fieldDefinition;
        }
      }
      
      // Para otros tipos, usar el código existente
      let fieldDefinition = `${field.name}: { 
        type: ${this.mapJsTypeToMongooseType(field.type)}`;
      
      // Configurar tipo de items para arrays
      if (field.type === 'array' && field.items) {
        if (typeof field.items === 'string') {
          // Si items es un string, es un tipo simple
          const itemType = this.mapJsTypeToMongooseType(field.items as JavaScriptType);
          fieldDefinition = `${field.name}: [{ 
        type: ${itemType}
      }]`;
          return fieldDefinition;
        }
      }
      
      if (field.required) {
        fieldDefinition += `,
        required: true`;
      }
      
      if (field.unique) {
        fieldDefinition += `,
        unique: true`;
      }
      
      if (field.enum && field.enum.length > 0) {
        const enumValues = field.enum.map(val => `'${val}'`).join(', ');
        fieldDefinition += `,
        enum: [${enumValues}]`;
      }
      
      if (field.default !== undefined) {
        let defaultValue;
        
        if (field.type === 'string') {
          defaultValue = `'${field.default}'`;
        } else if (field.default === 'Date.now') {
          defaultValue = 'Date.now';
        } else {
          defaultValue = field.default;
        }
        
        fieldDefinition += `,
        default: ${defaultValue}`;
      }
      
      if (field.ref) {
        fieldDefinition += `,
        ref: '${StringUtils.toPascalCase(field.ref)}'`;
      }
      
      if (field.min !== undefined) {
        if (field.type === 'string') {
          fieldDefinition += `,
        minlength: ${field.min}`;
        } else if (field.type === 'number') {
          fieldDefinition += `,
        min: ${field.min}`;
        }
      }
      
      if (field.max !== undefined) {
        if (field.type === 'string') {
          fieldDefinition += `,
        maxlength: ${field.max}`;
        } else if (field.type === 'number') {
          fieldDefinition += `,
        max: ${field.max}`;
        }
      }
      
      fieldDefinition += `
      }`;
      
      return fieldDefinition;
    }).join(',\n\n  ');
  }

  /**
   * Genera definiciones de tipos para TypeScript
   */
  private generateTypeScriptTypes(fields: Field[]): string {
    return fields.map(field => {
      let typeDefinition = `  ${field.name}`;
      
      if (!field.required) {
        typeDefinition += '?';
      }
      
      let tsType: string;
      
      // Si es un subdocumento, generar una interfaz para ese tipo
      if (field.type === 'schema' && field.schemaRef) {
        const subSchema = this.getSubdocumentSchema(field.schemaRef);
        if (subSchema) {
          tsType = `I${StringUtils.toPascalCase(field.schemaRef)}`;
          // Asegurarnos de que la interfaz del subdocumento esté definida
          this.generateSubdocumentInterface(subSchema);
        } else {
          tsType = 'Record<string, any>';
        }
      } 
      // Si es un array con elementos de tipo schema
      else if (field.type === 'array' && typeof field.items === 'object' && field.items.type === 'schema' && field.items.schemaRef) {
        const subSchema = this.getSubdocumentSchema(field.items.schemaRef);
        if (subSchema) {
          tsType = `I${StringUtils.toPascalCase(field.items.schemaRef)}[]`;
          // Asegurarnos de que la interfaz del subdocumento esté definida
          this.generateSubdocumentInterface(subSchema);
        } else {
          tsType = 'Record<string, any>[]';
        }
      } 
      // Para arrays de tipos simples
      else if (field.type === 'array' && field.items) {
        if (typeof field.items === 'string') {
          switch (field.items as JavaScriptType) {
            case 'string':
            case 'email':
              tsType = 'string[]';
              break;
            case 'number':
              tsType = 'number[]';
              break;
            case 'boolean':
              tsType = 'boolean[]';
              break;
            case 'date':
              tsType = 'Date[]';
              break;
            case 'object':
              tsType = 'Record<string, any>[]';
              break;
            case 'objectid':
              tsType = '(mongoose.Types.ObjectId | string)[]';
              break;
            default:
              tsType = 'any[]';
          }
        } else {
          tsType = 'any[]';
        }
      }
      // Para otros tipos
      else {
        switch (field.type) {
          case 'string':
          case 'email':
            tsType = 'string';
            break;
          case 'number':
            tsType = 'number';
            break;
          case 'boolean':
            tsType = 'boolean';
            break;
          case 'date':
            tsType = 'Date';
            break;
          case 'array':
            tsType = 'any[]';
            break;
          case 'object':
            tsType = 'Record<string, any>';
            break;
          case 'objectid':
            tsType = 'mongoose.Types.ObjectId | string';
            break;
          default:
            tsType = 'any';
        }
      }
      
      // Si es un enum, usar los valores como tipos
      if (field.enum && field.enum.length > 0) {
        tsType = field.enum.map(val => `'${val}'`).join(' | ');
      }
      
      typeDefinition += `: ${tsType};`;
      
      if (field.description) {
        typeDefinition = `  /**\n   * ${field.description}\n   */\n${typeDefinition}`;
      }
      
      return typeDefinition;
    }).join('\n\n');
  }

  /**
   * Genera interfaces para subdocumentos
   */
  private generateSubdocumentInterface(schema: DataSource): string {
    const interfaceName = `I${StringUtils.toPascalCase(schema.name)}`;
    const interfaceDefinition = `export interface ${interfaceName} {
${this.generateTypeScriptTypes(schema.fields)}
}`;
    
    return interfaceDefinition;
  }
  
  /**
   * Genera validaciones para los campos
   */
  private generateValidations(fields: Field[]): Record<string, string> {
    const validationImports = [
      'IsString', 'IsEmail', 'IsNumber', 'IsBoolean', 
      'IsDate', 'IsArray', 'IsObject', 'IsMongoId', 
      'IsOptional', 'IsNotEmpty', 'MinLength', 'MaxLength',
      'Min', 'Max', 'IsIn', 'ValidateNested', 'ArrayMinSize', 'ArrayMaxSize'
    ];
    
    // Validaciones para el DTO de creación
    const creationValidations = fields.map(field => {
      let validation = '';
      
      // Si es requerido, usar IsNotEmpty
      if (field.required) {
        validation += '@IsNotEmpty()';
      } else {
        validation += '@IsOptional()';
      }
      
      // Para subdocumentos
      if (field.type === 'schema' && field.schemaRef) {
        validation += `\n  @ValidateNested()`;
        validation += `\n  @Type(() => ${StringUtils.toPascalCase(field.schemaRef)}Dto)`;
        return `  ${validation}\n  ${field.name}?: ${StringUtils.toPascalCase(field.schemaRef)}Dto;`;
      }
      
      // Para arrays de subdocumentos
      if (field.type === 'array' && typeof field.items === 'object' && field.items.type === 'schema' && field.items.schemaRef) {
        validation += `\n  @IsArray()`;
        validation += `\n  @ValidateNested({ each: true })`;
        validation += `\n  @Type(() => ${StringUtils.toPascalCase(field.items.schemaRef)}Dto)`;
        
        // Si hay validaciones min/max para el array
        if (field.min !== undefined) {
          validation += `\n  @ArrayMinSize(${field.min})`;
        }
        
        if (field.max !== undefined) {
          validation += `\n  @ArrayMaxSize(${field.max})`;
        }
        
        return `  ${validation}\n  ${field.name}?: ${StringUtils.toPascalCase(field.items.schemaRef)}Dto[];`;
      }
      
      // Validaciones según el tipo
      switch (field.type) {
        case 'string':
          validation += '\n  @IsString()';
          if (field.min !== undefined) {
            validation += `\n  @MinLength(${field.min})`;
          }
          if (field.max !== undefined) {
            validation += `\n  @MaxLength(${field.max})`;
          }
          break;
          
        case 'email':
          validation += '\n  @IsEmail()';
          break;
          
        case 'number':
          validation += '\n  @IsNumber()';
          if (field.min !== undefined) {
            validation += `\n  @Min(${field.min})`;
          }
          if (field.max !== undefined) {
            validation += `\n  @Max(${field.max})`;
          }
          break;
          
        case 'boolean':
          validation += '\n  @IsBoolean()';
          break;
          
        case 'date':
          validation += '@IsDate()';
          break;
          
        case 'array':
          validation += '@IsArray()';
          // Validar el tipo de elementos del array si se conoce
          if (typeof field.items === 'string') {
            switch (field.items as JavaScriptType) {
              case 'string':
                validation += '\n  @ArrayNotEmpty()';
                validation += '\n  @IsString({ each: true })';
                break;
              case 'number':
                validation += '\n  @IsNumber({}, { each: true })';
                break;
              case 'boolean':
                validation += '\n  @IsBoolean({ each: true })';
                break;
              case 'date':
                validation += '\n  @IsDate({ each: true })';
                break;
              case 'objectid':
                validation += '\n  @IsMongoId({ each: true })';
                break;
            }
          }
          
          // Si hay validaciones min/max para el array
          if (field.min !== undefined) {
            validation += `\n  @ArrayMinSize(${field.min})`;
          }
          
          if (field.max !== undefined) {
            validation += `\n  @ArrayMaxSize(${field.max})`;
          }
          break;
          
        case 'object':
          validation += '@IsObject()';
          break;
          
        case 'objectid':
          validation += '@IsMongoId()';
          break;
      }
      
      if (field.enum && field.enum.length > 0) {
        const enumValues = field.enum.map(val => `'${val}'`).join(', ');
        validation += `\n  @IsIn([${enumValues}])`;
      }
      
      let typeStr: string;
      
      // Determinar el tipo para la definición del campo
      if (field.type === 'array' && field.items) {
        if (typeof field.items === 'string') {
          switch (field.items as JavaScriptType) {
            case 'string':
              typeStr = 'string[]';
              break;
            case 'number':
              typeStr = 'number[]';
              break;
            case 'boolean':
              typeStr = 'boolean[]';
              break;
            case 'date':
              typeStr = 'Date[]';
              break;
            case 'objectid':
              typeStr = 'string[]';
              break;
            default:
              typeStr = 'any[]';
          }
        } else {
          typeStr = 'any[]';
        }
      } else {
        switch (field.type) {
          case 'date':
            typeStr = 'Date';
            break;
          case 'array':
            typeStr = 'any[]';
            break;
          case 'objectid':
            typeStr = 'string';
            break;
          default:
            typeStr = field.type;
        }
      }
      
      return `  ${validation}\n  ${field.name}?: ${typeStr};`;
    }).join('\n\n');
    
    // DTO de actualización usa las mismas validaciones pero todo opcional
    const updateValidations = creationValidations.replace(/@IsNotEmpty\(\)/g, '@IsOptional()');
    
    return {
      createDTO: creationValidations,
      updateDTO: updateValidations,
      validationImports: Array.from(new Set([
        ...validationImports,
        'ArrayNotEmpty'
      ])).join(', ')
    };
  }

  /**
   * Genera interfaces de subdocumentos para incluir en el DTO
   */
  private generateSubdocumentDTOs(dataSource: DataSource): Map<string, string> {
    const dtoMap = new Map<string, string>();
    
    // Buscar campos que son subdocumentos o arrays de subdocumentos
    for (const field of dataSource.fields) {
      // Caso 1: Campo de tipo schema
      if (field.type === 'schema' && field.schemaRef) {
        this.processSubdocumentSchema(field.schemaRef, dtoMap);
      }
      
      // Caso 2: Array con items de tipo schema
      if (field.type === 'array' && typeof field.items === 'object' && 
          field.items.type === 'schema' && field.items.schemaRef) {
        this.processSubdocumentSchema(field.items.schemaRef, dtoMap);
      }
    }
    
    return dtoMap;
  }
  
  /**
   * Procesa un esquema de subdocumento y lo añade al mapa de DTOs
   */
  private processSubdocumentSchema(schemaRef: string, dtoMap: Map<string, string>): void {
    const subSchema = this.getSubdocumentSchema(schemaRef);
    if (subSchema) {
      // Generar DTO para el subdocumento
      const dtoName = `${StringUtils.toPascalCase(schemaRef)}Dto`;
      
      // Verificar si ya generamos este DTO
      if (!dtoMap.has(dtoName)) {
        const dtoContent = `export class ${dtoName} {
${this.generateValidations(subSchema.fields).createDTO}
}`;
        dtoMap.set(dtoName, dtoContent);
        
        // Procesar recursivamente subdocumentos anidados en el esquema
        for (const subField of subSchema.fields) {
          // Subdocumento anidado
          if (subField.type === 'schema' && subField.schemaRef) {
            this.processSubdocumentSchema(subField.schemaRef, dtoMap);
          }
          
          // Array de subdocumentos anidado
          if (subField.type === 'array' && typeof subField.items === 'object' && 
              subField.items.type === 'schema' && subField.items.schemaRef) {
            this.processSubdocumentSchema(subField.items.schemaRef, dtoMap);
          }
        }
      }
    }
  }

  /**
   * Recolecta todas las interfaces de subdocumentos utilizadas por el esquema
   */
  private collectSubdocumentInterfaces(dataSource: DataSource): Map<string, string> {
    const interfaces = new Map<string, string>();
    
    // Función recursiva para procesar subdocumentos
    const processFields = (fields: Field[]) => {
      for (const field of fields) {
        // Caso 1: Campo subdocumento
        if (field.type === 'schema' && field.schemaRef) {
          const subSchema = this.getSubdocumentSchema(field.schemaRef);
          if (subSchema) {
            const interfaceName = `I${StringUtils.toPascalCase(field.schemaRef)}`;
            if (!interfaces.has(interfaceName)) {
              const interfaceText = this.generateSubdocumentInterface(subSchema);
              interfaces.set(interfaceName, interfaceText);
              // Procesar recursivamente los campos del subdocumento
              processFields(subSchema.fields);
            }
          }
        } 
        // Caso 2: Array con subdocumentos
        else if (field.type === 'array' && typeof field.items === 'object' && 
                 field.items.type === 'schema' && field.items.schemaRef) {
          const subSchema = this.getSubdocumentSchema(field.items.schemaRef);
          if (subSchema) {
            const interfaceName = `I${StringUtils.toPascalCase(field.items.schemaRef)}`;
            if (!interfaces.has(interfaceName)) {
              const interfaceText = this.generateSubdocumentInterface(subSchema);
              interfaces.set(interfaceName, interfaceText);
              // Procesar recursivamente los campos del subdocumento
              processFields(subSchema.fields);
            }
          }
        }
      }
    };
    
    // Iniciar procesamiento desde los campos principales
    processFields(dataSource.fields);
    
    return interfaces;
  }

  /**
   * Prepara las especificaciones para generar los archivos
   */
  private prepareSpecs(dataSource: DataSource): Specs {
    const { name, fields } = dataSource;
    
    const resourceNameLower = StringUtils.toCamelCase(name);
    const resourceNameUpper = StringUtils.toPascalCase(name);
    const resourceNamePlural = StringUtils.pluralize(resourceNameLower);
    
    // Crear el directorio base y el path para los archivos
    const { resourcesDir } = FileUtils.getProjectPaths();
    const resourcePath = path.join(resourcesDir, resourceNameUpper);
    
    // Recolectar todas las interfaces de subdocumentos
    const subdocumentInterfaces = this.collectSubdocumentInterfaces(dataSource);
    
    const specs: Specs = {
      resourceName: name,
      resourceNameLower,
      resourceNameUpper,
      resourceNamePlural,
      resourcePath,
      apiPath: dataSource.apiPath || resourceNamePlural,
      mongoSchema: this.generateMongooseSchemaFields(fields),
      typeDefinitions: this.generateTypeScriptTypes(fields),
      validations: this.generateValidations(fields),
      hasTimestamps: dataSource.timestamps !== false, // Por defecto true
      hasSoftDelete: dataSource.softDelete === true,
      subdocumentInterfaces: Array.from(subdocumentInterfaces.values()).join('\n\n'),
      hasSubdocumentInterfaces: subdocumentInterfaces.size > 0
    };
    
    return specs;
  }

  /**
   * Genera todos los archivos necesarios para el recurso
   */
  public generateResourceFiles(dataSource: DataSource): void {
    try {
      const specs = this.prepareSpecs(dataSource);
      const { templatesDir } = FileUtils.getProjectPaths();
      
      // Crear el directorio del recurso si no existe
      FileUtils.ensureDirectoryExists(specs.resourcePath as string);
      
      // Generar subdocumentos DTOs si hay campos de tipo schema
      const subdocumentDTOs = this.generateSubdocumentDTOs(dataSource);
      
      // Generar cada tipo de archivo del recurso
      for (const [key, templateFile] of Object.entries(this.templates)) {
        const templatePath = path.join(templatesDir, templateFile);
        
        // Verificar si la template existe
        if (!FileUtils.fileExists(templatePath)) {
          // eslint-disable-next-line no-console
          console.error(`La plantilla ${templateFile} no existe en ${templatesDir}`);
          continue;
        }
        
        // Cargar el contenido de la template
        const templateContent = FileUtils.readFile(templatePath);
        
        // Compilar la template con Handlebars con la opción noEscape
        const template = Handlebars.compile(templateContent, { noEscape: true });
        
        // Si es DTO y hay subdocumentos, añadirlos
        if (key === 'dto' && subdocumentDTOs.size > 0) {
          specs.hasSubdocuments = true;
          specs.subdocumentDTOs = Array.from(subdocumentDTOs.values()).join('\n\n');
        } else {
          specs.hasSubdocuments = false;
        }
        
        // Generar el contenido
        const content = template(specs);
        
        // Definir el nombre del archivo
        let fileName;
        if (key === 'dto') {
          fileName = `${specs.resourceNameUpper}Dto.ts`;
        } else {
          fileName = `${specs.resourceNameUpper}${StringUtils.toPascalCase(key)}.ts`;
        }
        
        // Ruta completa del archivo
        const filePath = path.join(specs.resourcePath as string, fileName);
        
        // Escribir el archivo
        FileUtils.writeFile(filePath, content);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al generar los archivos del recurso:', error);
      throw error;
    }
  }
} 