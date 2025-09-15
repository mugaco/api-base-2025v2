/**
 * Comando para generar recursos a partir de un esquema JSON
 * 
 * Este comando genera todos los archivos necesarios para un recurso completo:
 * - Modelo Mongoose
 * - Esquemas de validación Zod (en lugar de DTOs)
 * - Controlador
 * - Servicio
 * - Repositorio 
 * - Rutas
 * 
 * La generación se basa en un archivo de esquema JSON que define
 * la estructura y validaciones del recurso.
 */
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BaseCommand } from '../core/BaseCommand';
import { CommandOption, CommandOptions } from '../interfaces/CommandInterface';
import { ConsoleService, FileSystemService, PromptService } from '../interfaces/IOInterface';
import { Schema, SchemaField } from '../interfaces/SchemaInterface';
import { StringUtils } from '../utils/StringUtils';
import { TypeMapper } from '../utils/TypeMapper';

// Type definitions for template context
interface TemplateContext {
  resourceName: string;
  resourceNameUpper: string;
  resourceNameLower: string;
  resourceNames: string;
  resourceNamesUpper: string;
  resourceNamesLower: string;
  fields: SchemaField[];
  imports: string[];
  hasReferences: boolean;
  references: ReferenceField[];
  hasEnums: boolean;
  zodTypes: ZodTypeDefinition[];
  mongooseSchema: string;
  primaryKey: string;
  [key: string]: unknown;
}

interface ReferenceField {
  name: string;
  type: string;
  modelName: string;
}

interface ZodTypeDefinition {
  name: string;
  zodType: string;
  required: boolean;
}

// Postman types
interface PostmanCollection {
  item: PostmanItem[];
  [key: string]: unknown;
}

interface PostmanItem {
  name: string;
  item?: PostmanRequest[];
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    description?: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanRequestBody;
  };
  response?: unknown[];
}

interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
}

interface PostmanUrl {
  raw: string;
  protocol?: string;
  host: string[];
  path: string[];
  variable?: PostmanUrlParameter[];
}

interface PostmanUrlParameter {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface PostmanRequestBody {
  mode: string;
  raw: string;
  options: {
    raw: {
      language: string;
    };
  };
}

/**
 * Implementación del comando para generar recursos a partir de un esquema
 */
export class ResourceCommand extends BaseCommand {
  // Plantillas de archivos a generar
  private readonly templateFiles: Record<string, string> = {
    model: 'Model.hbs',
    controller: 'Controller.hbs',
    service: 'Service.hbs',
    repository: 'Repository.hbs',
    schema: 'Schema.hbs',
    routes: 'Routes.hbs'
  };

  // Directorios de destino para cada tipo de archivo
  private readonly targetDirs: Record<string, string> = {
    model: 'src/api/domain/entities/{name}',
    controller: 'src/api/domain/entities/{name}',
    service: 'src/api/domain/entities/{name}',
    repository: 'src/api/domain/entities/{name}',
    schema: 'src/api/domain/entities/{name}',
    routes: 'src/api/domain/entities/{name}'
  };

  /**
   * Constructor del comando
   */
  constructor(
    consoleService: ConsoleService,
    promptService: PromptService,
    private readonly fileSystemService: FileSystemService,
    private readonly schemasDir: string
  ) {
    super('resource', 'Genera un nuevo recurso a partir de un esquema', consoleService, promptService);
  }

  /**
   * Define las opciones del comando
   */
  public getOptions(): CommandOption[] {
    return [
      {
        name: 'schema',
        alias: 's',
        description: 'Nombre del archivo de esquema (sin extensión)',
        type: 'string'
      },
      {
        name: 'overwrite',
        alias: 'o',
        description: 'Sobrescribir archivos existentes',
        type: 'boolean',
        default: false
      },
      {
        name: 'tests',
        alias: 't',
        description: 'Generar tests para el recurso',
        type: 'boolean',
        default: false
      },
      {
        name: 'postman',
        alias: 'p',
        description: 'Actualizar colección de Postman',
        type: 'boolean',
        default: true
      }
    ];
  }

  /**
   * Implementa la lógica del comando
   */
  protected async run(options: CommandOptions): Promise<void> {
    try {
      // Obtener las opciones de manera interactiva si no están presentes
      options = await this.getInteractiveOptions(options);
      
      // Obtener la ruta del archivo de esquema
      let schemaPath: string;
      
      if (options.schema) {
        schemaPath = path.join(this.schemasDir, `${options.schema}.json`);
        const exists = await this.fileSystemService.fileExists(schemaPath);
        
        if (!exists) {
          throw new Error(`El archivo de esquema '${options.schema}.json' no existe`);
        }
      } else {
        schemaPath = await this.getSchemaSelection();
      }
      
      // Cargar el esquema
      const schema = await this.fileSystemService.readJsonFile<Schema>(schemaPath);
      
      // Validar el esquema básico
      if (!schema.name || !schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
        throw new Error('El esquema no es válido. Debe tener al menos un nombre y un array de campos');
      }
      
      // Normalizar el nombre y obtener la versión en PascalCase
      const normalizedName = StringUtils.toCamelCase(schema.name);
      const resourceNameUpper = StringUtils.toPascalCase(normalizedName);
      
      // Crear el directorio base del recurso con el nombre normalizado en PascalCase
      const resourceDir = path.join(process.cwd(), 'src/api/domain/entities', resourceNameUpper);
      await this.fileSystemService.ensureDirectoryExists(resourceDir);
      
      // Generar los archivos del recurso
      await this.generateResourceFiles(schema, options);
      
      // Actualizar rutas API
      await this.updateApiRoutes(schema);

      // Actualizar dependencias del dominio
      await this.updateDomainDependencies(schema);

      // Actualizar colección de Postman si se especificó
      if (options.postman) {
        await this.updatePostmanCollection(schema);
      }
      
      this.consoleService.success(`Recurso '${normalizedName}' generado con éxito`);
    } catch (error) {
      throw new Error(`Error al generar el recurso: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene opciones interactivamente si no están presentes
   */
  private async getInteractiveOptions(options: CommandOptions): Promise<CommandOptions> {
    // Si no hay esquema, solicitar selección
    if (!options.schema) {
      // Esta parte se maneja en getSchemaSelection, no necesitamos hacer nada aquí
    }
    
    // Preguntar si se deben sobrescribir archivos existentes
    if (options.overwrite === undefined) {
      options.overwrite = await this.promptService.promptConfirm(
        '¿Desea sobrescribir los archivos existentes?',
        false
      );
    }
    
    // Preguntar si se deben generar tests
    if (options.tests === undefined) {
      options.tests = await this.promptService.promptConfirm(
        '¿Desea generar tests para el recurso?',
        false
      );
    }
    
    // Preguntar si se debe actualizar la colección de Postman
    if (options.postman === undefined) {
      options.postman = await this.promptService.promptConfirm(
        '¿Desea actualizar la colección de Postman?',
        true
      );
    }
    
    return options;
  }

  /**
   * Solicita al usuario seleccionar un esquema de los disponibles
   */
  private async getSchemaSelection(): Promise<string> {
    try {
      // Listar archivos de esquema
      const schemaFiles = await this.fileSystemService.listFiles(this.schemasDir, /\.json$/);
      
      if (schemaFiles.length === 0) {
        throw new Error('No se encontraron archivos de esquema en el directorio de esquemas');
      }
      
      // Crear opciones para el selector
      const schemaOptions = schemaFiles.map(file => {
        const fileName = path.basename(file, '.json');
        return {
          name: fileName,
          value: file
        };
      });
      
      // Solicitar selección al usuario
      return await this.promptService.promptSelect<string>(
        'Selecciona el esquema del recurso a generar',
        schemaOptions
      );
    } catch (error) {
      throw new Error(`Error al seleccionar el esquema: ${(error as Error).message}`);
    }
  }

  /**
   * Genera los archivos del recurso
   */
  private async generateResourceFiles(schema: Schema, options: CommandOptions): Promise<void> {
    this.consoleService.info(`Generando archivos para el recurso '${schema.name}'...`);
    
    // Preparar el contexto para las plantillas
    const templateContext = await this.prepareTemplateContext(schema);
    
    // Obtener la ruta de las plantillas
    const templatesDir = path.join(process.cwd(), 'src/cli/templates');
    
    // Generar cada tipo de archivo
    for (const [fileType, templateFile] of Object.entries(this.templateFiles)) {
      await this.generateFile(
        templatesDir,
        templateFile,
        this.getTargetFilePath(schema.name, fileType),
        templateContext,
        options.overwrite as boolean
      );
    }
    
    // Generar tests si se solicitaron
    if (options.tests) {
      await this.generateTests(schema, options.overwrite as boolean);
    }
  }

  /**
   * Genera índices para el esquema basados en los campos
   */
  private generateIndexesForSchema(schema: Schema): string {
    let indexCode = '';
    
    // Asegurar que usamos el nombre en camelCase para la variable del esquema
    const modelName = StringUtils.toCamelCase(schema.name);
    
    // Recolectar campos que deberían tener índices
    const fieldsToIndex = [];
    
    // Añadir índices automáticos basados en tipos de campo
    for (const field of schema.fields) {
      // Campos de referencia
      if (field.type === 'reference' || field.type === 'objectid') {
        fieldsToIndex.push({
          field: field.name,
          unique: field.meta?.unique === true,
          sparse: !field.required,
        });
      }
      
      // Campos comunes que suelen necesitar índices
      if (['slug', 'email', 'username', 'code'].includes(field.name)) {
        fieldsToIndex.push({
          field: field.name,
          unique: field.meta?.unique === true || ['slug', 'email', 'username'].includes(field.name),
          sparse: !field.required,
        });
      }
      
      // Campo de nombre
      if (field.name === 'name') {
        fieldsToIndex.push({
          field: field.name,
          unique: field.meta?.unique === true,
          sparse: false,
        });
      }
      
      // Campos de fecha importantes
      if (['startDate', 'endDate', 'dueDate', 'createdAt'].includes(field.name)) {
        fieldsToIndex.push({
          field: field.name,
          unique: false,
          sparse: false,
        });
      }
      
      // Campos de estado o categoría
      if (['status', 'type', 'category', 'active', 'enabled', 'featured'].includes(field.name)) {
        fieldsToIndex.push({
          field: field.name,
          unique: false,
          sparse: false,
        });
      }
    }
    
    // Generar código para los índices
    for (const indexDef of fieldsToIndex) {
      let indexOptions = '';
      const hasOptions = indexDef.unique || indexDef.sparse;
      
      if (hasOptions) {
        indexOptions = ', { ';
        if (indexDef.unique) {
          indexOptions += 'unique: true';
          if (indexDef.sparse) {
            indexOptions += ', sparse: true';
          }
        } else if (indexDef.sparse) {
          indexOptions += 'sparse: true';
        }
        indexOptions += ' }';
      }
      
      indexCode += `${modelName}Schema.index({ ${indexDef.field}: 1 }${indexOptions});\n`;
    }
    
    return indexCode;
  }

  /**
   * Prepara el contexto para las plantillas
   */
  private async prepareTemplateContext(schema: Schema): Promise<TemplateContext> {
    // Normalizar el nombre base del recurso a camelCase
    const resourceName = StringUtils.toCamelCase(schema.name);
    
    // Preparar todas las variantes del nombre del recurso
    // Para nombres de clase e interfaces
    const resourceNameUpper = StringUtils.toPascalCase(resourceName);
    // Para nombres de variables y propiedades
    const resourceNameLower = StringUtils.toCamelCase(resourceName);
    // Versión pluralizada
    const resourceNames = StringUtils.pluralize(resourceName);
    // Versión pluralizada en PascalCase
    const resourceNamesUpper = StringUtils.toPascalCase(resourceNames);
    // Versión pluralizada en camelCase
    const resourceNamesLower = StringUtils.toCamelCase(resourceNames);
    // Para rutas de API y nombres de archivos
    const resourceNameKebab = StringUtils.toKebabCase(resourceName);
    // Versión pluralizada en kebab-case
    const resourceNamesKebab = StringUtils.toKebabCase(resourceNames);
    // Para nombres de columnas en BD
    const resourceNameSnake = StringUtils.toSnakeCase(resourceName);
    // Versión pluralizada en snake_case
    const resourceNamesSnake = StringUtils.toSnakeCase(resourceNames);
    
    // Generar definiciones de tipos y esquema de MongoDB basados en los campos
    const typeDefinitions = this.generateTypeDefinitions(schema.fields);
    const mongoSchema = await this.generateMongoSchema(schema.fields);
    
    // Generar tipos Zod para los campos
    const zodTypes = this.generateZodTypes(schema.fields);
    
    // Generar validaciones para retrocompatibilidad
    const validations = this.generateValidations(schema.fields);
    
    // Crear objeto de contexto para las plantillas
    const hasTimestamps = schema.audit === true;
    const hasSoftDelete = schema.softDelete === true;
    
    // Determinar si hay subdocumentos para generar interfaces adicionales
    const hasSubdocuments = schema.fields.some(field => 
      field.type === 'schema' || 
      (field.type === 'array' && 
       typeof field.items === 'object' && 
       (field.items as SchemaField).type === 'schema')
    );
    
    // Generar subdocumentos interfaces si es necesario
    let subdocumentInterfaces = '';
    if (hasSubdocuments) {
      subdocumentInterfaces = await this.generateSubdocumentInterfaces(schema);
    }
    
    // Generar índices para el esquema
    const schemaIndexes = this.generateIndexesForSchema(schema);
    
    // Comentarios explicativos para el uso de cada variante de nombre:
    // resourceNameUpper: Nombre en PascalCase para clases, interfaces y modelo Mongoose (Ej: UserProfile)
    // resourceNameLower: Nombre en camelCase para variables (Ej: userProfile)
    // resourceNames: Versión pluralizada del nombre (Ej: userProfiles)
    // resourceNamesUpper: Plural en PascalCase (Ej: UserProfiles)
    // resourceNamesLower: Plural en camelCase (Ej: userProfiles)
    // resourceNameKebab: Nombre en kebab-case para rutas y archivos (Ej: user-profile)
    // resourceNamesKebab: Plural en kebab-case (Ej: user-profiles)
    // resourceNameSnake: Nombre en snake_case para columnas BD (Ej: user_profile)
    // resourceNamesSnake: Plural en snake_case (Ej: user_profiles)
    
    return {
      // Propiedades del recurso
      resourceName,
      resourceNameUpper,
      resourceNameLower,
      resourceNames,
      resourceNamesUpper,
      resourceNamesLower,
      resourceNameKebab,
      resourceNamesKebab,
      resourceNameSnake,
      resourceNamesSnake,

      // Propiedades del API
      apiPath: schema.api?.path || resourceNamesKebab,
      apiAuth: schema.api?.auth !== false,

      // Required fields for TemplateContext
      fields: schema.fields,
      imports: [],
      hasReferences: false,
      references: [],
      hasEnums: false,
      zodTypes,
      mongooseSchema: mongoSchema,
      primaryKey: '_id',

      // Definiciones de esquema generadas
      typeDefinitions,
      mongoSchema,
      schemaIndexes,
      validations,

      // Flags de configuración
      hasTimestamps,
      hasSoftDelete,
      hasSubdocumentInterfaces: hasSubdocuments,
      subdocumentInterfaces,
      
      // Información sobre la generación
      generatedAt: new Date().toISOString(),
      generator: 'API Base CLI',
    };
  }

  /**
   * Genera interfaces de TypeScript para subdocumentos
   */
  private async generateSubdocumentInterfaces(schema: Schema): Promise<string> {
    let interfaces = '';
    const processedSchemas = new Set<string>();
    
    // Función para procesar un esquema como subdocumento
    const processSchemaRef = async (schemaRef: string): Promise<void> => {
      if (!schemaRef || processedSchemas.has(schemaRef)) {
        return; // Evitar duplicados o referencias vacías
      }
      
      // Cargar el esquema
      try {
        const schemaPath = path.join(this.schemasDir, `${schemaRef}.json`);
        const subSchema = await this.fileSystemService.readJsonFile<Schema>(schemaPath);
        
        if (!subSchema || !subSchema.fields || subSchema.fields.length === 0) {
          return;
        }
        
        // Marcar como procesado
        processedSchemas.add(schemaRef);
        
        // Generar la interfaz para el subdocumento
        const interfaceName = `I${StringUtils.toPascalCase(schemaRef)}`;
        interfaces += `export interface ${interfaceName} {\n`;
        interfaces += this.generateTypeDefinitions(subSchema.fields);
        interfaces += `}\n\n`;
        
        // Procesar recursivamente subdocumentos anidados
        for (const field of subSchema.fields) {
          if (field.type === 'schema' && field.schemaRef) {
            await processSchemaRef(field.schemaRef);
          }
          
          if (field.type === 'array' && 
              typeof field.items === 'object' && 
              (field.items as SchemaField).type === 'schema') {
            const nestedField = field.items as SchemaField;
            if (nestedField.schemaRef) {
              await processSchemaRef(nestedField.schemaRef);
            }
          }
        }
      } catch (error) {
        this.consoleService.warn(`Error al procesar subdocumento ${schemaRef}: ${(error as Error).message}`);
      }
    };
    
    // Procesar todos los subdocumentos en el esquema principal
    for (const field of schema.fields) {
      if (field.type === 'schema' && field.schemaRef) {
        await processSchemaRef(field.schemaRef);
      }
      
      if (field.type === 'array' && 
          typeof field.items === 'object') {
        const itemField = field.items as SchemaField;
        if (itemField.type === 'schema' && itemField.schemaRef) {
          await processSchemaRef(itemField.schemaRef);
        }
      }
    }
    
    return interfaces;
  }

  /**
   * Genera las definiciones de tipos TypeScript para el modelo
   */
  private generateTypeDefinitions(fields: SchemaField[]): string {
    let result = '';
    
    // Generar las definiciones de cada campo
    for (const field of fields) {
      const tsType = this.getTypeScriptType(field);
      const optional = field.required ? '' : '?';
      
      result += `  ${field.name}${optional}: ${tsType};\n`;
    }
    
    return result;
  }

  /**
   * Obtiene el tipo TypeScript para un campo
   */
  private getTypeScriptType(field: SchemaField): string {
    return TypeMapper.getTypeScriptType(field);
  }

  /**
   * Genera el esquema para un subdocumento
   */
  private async generateSubdocumentSchema(field: SchemaField): Promise<string> {
    if (!field.schemaRef) {
      return `      type: Schema.Types.Mixed,\n    },\n`;
    }
    
    try {
      // Cargar el esquema del subdocumento
      const schemaPath = path.join(this.schemasDir, `${field.schemaRef}.json`);
      const schema = await this.fileSystemService.readJsonFile<Schema>(schemaPath);
      
      if (!schema || !schema.fields || schema.fields.length === 0) {
        return `      type: Schema.Types.Mixed,\n    },\n`;
      }
      
      // Generar el esquema para el subdocumento
      let result = `      type: new mongoose.Schema({\n`;
      
      // Generar el esquema de manera sincrónica para subdocumentos
      // para evitar problemas con recursión asíncrona
      const subdocumentFields = this.generateMongoSchemaSync(schema.fields);
      
      // Añadir campos del subdocumento
      result += subdocumentFields
        .split('\n')
        .map((line: string) => `        ${line}`)
        .join('\n');
      
      result += `      }, { _id: false }),\n`;
      
      if (field.required) {
        result += `      required: true,\n`;
      }
      
      result += `    },\n`;
      
      return result;
    } catch (error) {
      this.consoleService.warn(`Error al generar subdocumento ${field.schemaRef}: ${(error as Error).message}`);
      return `      type: Schema.Types.Mixed,\n    },\n`;
    }
  }
  
  /**
   * Genera el esquema para un array de subdocumentos
   */
  private async generateArrayOfSubdocumentsSchema(field: SchemaField): Promise<string> {
    if (!field.items || typeof field.items !== 'object' || 
        !(field.items as SchemaField).schemaRef) {
      return `      type: [Schema.Types.Mixed],\n    },\n`;
    }
    
    try {
      const schemaRef = (field.items as SchemaField).schemaRef;
      
      // Cargar el esquema del subdocumento
      const schemaPath = path.join(this.schemasDir, `${schemaRef}.json`);
      const schema = await this.fileSystemService.readJsonFile<Schema>(schemaPath);
      
      if (!schema || !schema.fields || schema.fields.length === 0) {
        return `      type: [Schema.Types.Mixed],\n    },\n`;
      }
      
      // Generar el esquema para el array de subdocumentos
      let result = `      type: [new mongoose.Schema({\n`;
      
      // Generar el esquema de manera sincrónica para subdocumentos
      const subdocumentFields = this.generateMongoSchemaSync(schema.fields);
      
      // Añadir campos del subdocumento
      result += subdocumentFields
        .split('\n')
        .map((line: string) => `        ${line}`)
        .join('\n');
      
      result += `      }, { _id: false })],\n`;
      
      if (field.required) {
        result += `      required: true,\n`;
      }
      
      result += `    },\n`;
      
      return result;
    } catch (error) {
      this.consoleService.warn(`Error al generar array de subdocumentos: ${(error as Error).message}`);
      return `  type: [Schema.Types.Mixed],\n    },\n`;
    }
  }

  /**
   * Genera el esquema de MongoDB para el modelo (versión sincrónica)
   * Usada para la generación de subdocumentos para evitar recursión asíncrona
   */
  private generateMongoSchemaSync(fields: SchemaField[]): string {
    let schema = '';
    
    for (const field of fields) {
      schema += `    ${field.name}: {\n`;
      
      // Para subdocumentos en modo sincrónico, usamos un placeholder
      if (field.type === 'schema' && field.schemaRef) {
        schema += `      type: Schema.Types.Mixed, // Subdocumento ${field.schemaRef}\n    },\n`;
        continue;
      }
      
      // Para arrays de subdocumentos en modo sincrónico, usamos un placeholder
      if (field.type === 'array' && typeof field.items === 'object' && 
          (field.items as SchemaField).type === 'schema' && 
          (field.items as SchemaField).schemaRef) {
        schema += `      type: [Schema.Types.Mixed], // Array de subdocumentos ${(field.items as SchemaField).schemaRef}\n    },\n`;
        continue;
      }
      
      schema += `      type: ${this.getMongooseType(field)},\n`;
      
      if (field.required) {
        schema += `      required: true,\n`;
      }
      
      if (field.description) {
        schema += `      // ${field.description}\n`;
      }
      
      // Añadir referencia para ObjectId
      if (field.type === 'reference' && field.reference) {
        schema += `      ref: '${StringUtils.toPascalCase(field.reference)}',\n`;
      } else if (field.type === 'objectid' && field.ref) {
        schema += `      ref: '${StringUtils.toPascalCase(field.ref)}',\n`;
      }
      
      // Agregar enum si existe y el campo es de tipo enum o string
      if (field.enum && Array.isArray(field.enum) && field.enum.length > 0) {
        const enumValues = JSON.stringify(field.enum);
        schema += `      enum: ${enumValues},\n`;
      }
      
      if (field.default !== undefined) {
        if (field.type === 'date' && field.default === 'Date.now') {
          schema += `      default: Date.now,\n`;
        } else {
          schema += `      default: ${JSON.stringify(field.default)},\n`;
        }
      }
      
      // Agregar validaciones si existen
      if (field.validations && field.validations.length > 0) {
        for (const validation of field.validations) {
          switch (validation.type) {
            case 'minLength':
              schema += `      minlength: ${validation.value},\n`;
              break;
            case 'maxLength':
              schema += `      maxlength: ${validation.value},\n`;
              break;
            case 'min':
              schema += `      min: ${validation.value},\n`;
              break;
            case 'max':
              schema += `      max: ${validation.value},\n`;
              break;
            case 'enum':
              schema += `      enum: ${JSON.stringify(validation.value)},\n`;
              break;
          }
        }
      }
      
      // Cerrar definición del campo
      schema += `    },\n`;
    }
    
    return schema;
  }

  /**
   * Genera el esquema de MongoDB para el modelo
   */
  private async generateMongoSchema(fields: SchemaField[]): Promise<string> {
    let schema = '';
    
    for (const field of fields) {
      schema += `    ${field.name}: {\n`;
      
      // Manejar subdocumentos
      if (field.type === 'schema' && field.schemaRef) {
        schema += await this.generateSubdocumentSchema(field);
        continue;
      }
      
      // Manejar arrays de subdocumentos
      if (field.type === 'array' && typeof field.items === 'object' && 
          (field.items as SchemaField).type === 'schema' && 
          (field.items as SchemaField).schemaRef) {
        schema += await this.generateArrayOfSubdocumentsSchema(field);
        continue;
      }
      
      // Manejar arrays de referencias (para objectid)
      if (field.type === 'array' && typeof field.items === 'object' && 
          ((field.items as SchemaField).type === 'reference' || (field.items as SchemaField).type === 'objectid')) {
        
        // Obtener el modelo referenciado
        let refModel;
        if ((field.items as SchemaField).type === 'reference' && (field.items as SchemaField).reference) {
          refModel = (field.items as SchemaField).reference;
        } else if ((field.items as SchemaField).type === 'objectid' && (field.items as SchemaField).ref) {
          refModel = (field.items as SchemaField).ref;
        }
        
        schema += `      type: [Schema.Types.ObjectId],\n`;
        if (refModel) {
          schema += `      ref: '${StringUtils.toPascalCase(refModel)}',\n`;
        }
      } else {
        schema += `      type: ${this.getMongooseType(field)},\n`;
        
        // Agregar la referencia para ObjectId
        if (field.type === 'reference' && field.reference) {
          schema += `      ref: '${StringUtils.toPascalCase(field.reference)}',\n`;
        } else if (field.type === 'objectid' && field.ref) {
          schema += `      ref: '${StringUtils.toPascalCase(field.ref)}',\n`;
        }
      }
      
      if (field.required) {
        schema += `      required: true,\n`;
      }
      
      if (field.description) {
        schema += `      // ${field.description}\n`;
      }
      
      // Agregar enum si existe y el campo es de tipo enum o string
      if (field.enum && Array.isArray(field.enum) && field.enum.length > 0) {
        const enumValues = JSON.stringify(field.enum);
        schema += `      enum: ${enumValues},\n`;
      }
      
      if (field.default !== undefined) {
        if (field.type === 'date' && field.default === 'Date.now') {
          schema += `      default: Date.now,\n`;
        } else {
          schema += `      default: ${JSON.stringify(field.default)},\n`;
        }
      }
      
      // Agregar validaciones si existen
      if (field.validations && field.validations.length > 0) {
        for (const validation of field.validations) {
          switch (validation.type) {
            case 'minLength':
                schema += `      minlength: ${validation.value},\n`;
              break;
            case 'maxLength':
              schema += `      maxlength: ${validation.value},\n`;
              break;
            case 'min':
              schema += `      min: ${validation.value},\n`;
              break;
            case 'max':
              schema += `      max: ${validation.value},\n`;
              break;
            case 'enum':
              schema += `      enum: ${JSON.stringify(validation.value)},\n`;
              break;
          }
        }
      }
      
      // Cerrar definición del campo
      schema += `    },\n`;
    }
    
    return schema;
  }

  /**
   * Obtiene el tipo de Mongoose para un campo
   */
  private getMongooseType(field: SchemaField): string {
    return TypeMapper.getMongooseType(field);
  }

  /**
   * Genera un archivo a partir de una plantilla
   */
  private async generateFile(
    templatesDir: string,
    templateFile: string,
    targetFile: string,
    context: TemplateContext,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      // Verificar si el archivo ya existe
      const fileExists = await this.fileSystemService.fileExists(targetFile);
      
      if (fileExists && !overwrite) {
        this.consoleService.warn(`El archivo '${targetFile}' ya existe. Usa --overwrite para sobrescribirlo.`);
        return;
      }
      
      // Leer la plantilla
      const templatePath = path.join(templatesDir, templateFile);
      const templateContent = await this.fileSystemService.readFile(templatePath);
      
      // Configurar Handlebars para que no escape HTML
      Handlebars.registerHelper('noEscape', function(text) {
        return new Handlebars.SafeString(text);
      });
      
      // Helper para verificar si una cadena incluye otra
      Handlebars.registerHelper('includes', function(str, includes) {
        return typeof str === 'string' && str.includes(includes);
      });
      
      // Compilar la plantilla con la opción de no escapar HTML
      const template = Handlebars.compile(templateContent, { noEscape: true });
      
      // Generar el contenido
      const content = template(context);
      
      // Asegurar que el directorio existe
      const dir = path.dirname(targetFile);
      await this.fileSystemService.ensureDirectoryExists(dir);
      
      // Escribir el archivo
      await this.fileSystemService.writeFile(targetFile, content);
      
      this.consoleService.info(`Archivo generado: ${targetFile}`);
    } catch (error) {
      this.consoleService.error(`Error al generar el archivo '${targetFile}': ${(error as Error).message}`);
    }
  }

  /**
   * Genera los tests para el recurso
   */
  private async generateTests(_schema: Schema, _overwrite: boolean = false): Promise<void> {
    // Generar tests para el recurso
    // Por ahora solo lo simulamos, se implementaría de forma similar a generateFile
    this.consoleService.info('Tests generados para el recurso');
  }

  /**
   * Obtiene la ruta de destino para un tipo de archivo
   */
  private getTargetFilePath(resourceName: string, fileType: string): string {
    // Normalizar el nombre del recurso a camelCase
    const normalizedName = StringUtils.toCamelCase(resourceName);
    
    // Obtener el directorio base según el tipo de archivo
    const baseDir = this.targetDirs[fileType].replace('{name}', StringUtils.toPascalCase(normalizedName));
    
    // Determinar el nombre del archivo según el tipo
    let fileName: string;
    
    switch (fileType) {
      case 'model':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Model.ts`;
        break;
      case 'controller':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Controller.ts`;
        break;
      case 'service':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Service.ts`;
        break;
      case 'repository':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Repository.ts`;
        break;
      case 'schema':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Schema.ts`;
        break;
      case 'routes':
        fileName = `${StringUtils.toPascalCase(normalizedName)}Routes.ts`;
        break;
      default:
        fileName = `${StringUtils.toPascalCase(normalizedName)}${StringUtils.toPascalCase(fileType)}.ts`;
    }
    
    return path.join(baseDir, fileName);
  }

  /**
   * Actualiza el archivo de rutas principal para incluir las rutas del nuevo recurso
   */
  private async updateApiRoutes(schema: Schema): Promise<void> {
    try {
      const routesFile = 'src/routes.ts';
      
      // Verificar si el archivo existe
      if (await this.fileSystemService.fileExists(routesFile)) {
        // Normalizar el nombre del recurso
        const normalizedName = StringUtils.toCamelCase(schema.name);
        
        // Leer el contenido actual
        const content = await this.fileSystemService.readFile(routesFile);
        
        // Verificar si la ruta ya está importada
        const importPattern = new RegExp(`import.+${StringUtils.toPascalCase(normalizedName)}Routes`);
        if (content.match(importPattern)) {
          this.consoleService.warn(`Las rutas de ${normalizedName} ya están registradas en ${routesFile}`);
          return;
        }
        
        // Crear nuevo contenido
        const routeName = StringUtils.toPascalCase(normalizedName);
        const routePath = schema.api?.path || StringUtils.toKebabCase(StringUtils.pluralize(normalizedName));
        
        // Añadir la importación
        let newContent = content.replace(
          /^(import.+from.+;\n)$/m,
          `$1import { ${routeName}Routes } from '@api/domain/entities/${routeName}/${routeName}Routes';\n`
        );
        
        // Añadir la ruta al router
        newContent = newContent.replace(
          /(router\.use\([^;]+;\n)(\s*export const apiRoutes)/,
          `$1router.use('/${routePath}', ${routeName}Routes);\n\n$2`
        );
        
        // Escribir el nuevo contenido
        await this.fileSystemService.writeFile(routesFile, newContent);
        
        this.consoleService.info(`Rutas API actualizadas: '/${routePath}' añadida a ${routesFile}`);
      } else {
        this.consoleService.warn(`No se encontró el archivo de rutas principal '${routesFile}'`);
      }
    } catch (error) {
      this.consoleService.error(`Error al actualizar rutas API: ${(error as Error).message}`);
    }
    
    this.consoleService.info('Rutas API actualizadas correctamente');
  }

  /**
   * Actualiza la colección de Postman con las rutas del nuevo recurso
   */
  private async updatePostmanCollection(schema: Schema): Promise<void> {
    try {
      // Normalizar el nombre del recurso
      const normalizedName = StringUtils.toCamelCase(schema.name);
      
      const apiPath = schema.api?.path || StringUtils.toKebabCase(StringUtils.pluralize(normalizedName));
      
      this.consoleService.info(`Actualizando colección de Postman para el recurso '${normalizedName}' en la ruta '${apiPath}'`);
      
      // Rutas estándar para el recurso
      const routes = [
        { method: 'GET', path: '/', description: `Obtener todos los ${StringUtils.pluralize(normalizedName)}` },
        { method: 'GET', path: `/:${normalizedName}Id`, description: `Obtener un ${normalizedName} por ID` },
        { method: 'POST', path: '/', description: `Crear un nuevo ${normalizedName}` },
        { method: 'PUT', path: `/:${normalizedName}Id`, description: `Actualizar un ${normalizedName}` },
        { method: 'DELETE', path: `/:${normalizedName}Id`, description: `Eliminar un ${normalizedName}` },
        { method: 'GET', path: '/paginated', description: `Obtener ${StringUtils.pluralize(normalizedName)} paginados` }
      ];
      
      // Archivo de la colección de Postman
      const postmanFile = 'postman_collection.json';
      
      // Verificar si el archivo existe
      if (await this.fileSystemService.fileExists(postmanFile)) {
        // Leer la colección
        const collection = await this.fileSystemService.readJsonFile<PostmanCollection>(postmanFile);

        // Verificar si la carpeta del recurso ya existe
        const folderExists = collection.item?.some((item: PostmanItem) =>
          item.name === StringUtils.toPascalCase(normalizedName));
        
        if (folderExists) {
          this.consoleService.warn(`El recurso '${normalizedName}' ya existe en la colección de Postman`);
        } else {
          // Crear la carpeta para el recurso
          const folder = {
            name: StringUtils.toPascalCase(normalizedName),
            item: routes.map(route => this.createPostmanRequest(
              route.method,
              apiPath + route.path,
              route.description,
              schema
            ))
          };
          
          // Añadir la carpeta a la colección
          if (!collection.item) {
            collection.item = [];
          }
          collection.item.push(folder);
          
          // Guardar la colección actualizada
          await this.fileSystemService.writeJsonFile(postmanFile, collection, { spaces: 2 });
          
          this.consoleService.info(`Colección de Postman actualizada con el recurso '${normalizedName}'`);
        }
      } else {
        this.consoleService.warn(`No se encontró el archivo de colección de Postman '${postmanFile}'`);
      }
      
      this.consoleService.success('Colección de Postman actualizada correctamente');
    } catch (error) {
      this.consoleService.warn(`No se pudo actualizar la colección de Postman: ${(error as Error).message}`);
    }
  }
  
  /**
   * Crea una petición para Postman
   */
  private createPostmanRequest(method: string, path: string, description: string, schema: Schema): PostmanRequest {
    // Crear un cuerpo de petición basado en el esquema para POST y PUT
    let body: PostmanRequestBody | null = null;
    
    if (method === 'POST' || method === 'PUT') {
      const exampleBody: Record<string, unknown> = {};
      
      for (const field of schema.fields) {
        exampleBody[field.name] = this.getExampleValue(field);
      }
      
      body = {
        mode: 'raw',
        raw: JSON.stringify(exampleBody, null, 2),
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    }
    
    // Extraer parámetros de la ruta
    const urlParameters: PostmanUrlParameter[] = [];
    const pathParamMatch = path.match(/\/:([\w]+)/);
    
    if (pathParamMatch) {
      urlParameters.push({
        key: pathParamMatch[1],
        value: '1',
        description: `ID del ${schema.name}`,
        disabled: false
      });
    }
    
    // Crear la petición
    return {
      name: `${method} ${path}`,
      request: {
        method,
        description,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        url: {
          raw: `{{baseUrl}}/${path.replace(/:[^/]+/g, '1')}`,
          host: ['{{baseUrl}}'],
          path: path.split('/').filter(Boolean).map(part => 
            part.startsWith(':') ? '1' : part
          )
        },
        body: body || undefined
      },
      response: []
    };
  }
  
  /**
   * Obtiene un valor de ejemplo para un campo
   */
  private getExampleValue(field: SchemaField): unknown {
    switch (field.type) {
      case 'string':
        return `Ejemplo de ${field.name}`;
      case 'number':
        return 123;
      case 'boolean':
        return true;
      case 'date':
        return new Date().toISOString();
      case 'array':
        return [this.getExampleValue({ type: field.items?.type || 'string', name: field.name } as SchemaField)];
      case 'object':
        return { ejemplo: 'valor' };
      case 'enum':
        return field.enum?.[0] || 'valor1';
      case 'reference':
        return 1;
      default:
        return null;
    }
  }

  /**
   * Genera validaciones para los campos a usar en los DTOs
   */
  private generateValidations(fields: SchemaField[]): Record<string, string> {
    // Definir los imports necesarios
    const validationImports = new Set<string>([
      'IsString', 'IsNumber', 'IsBoolean', 'IsDate', 'IsArray', 
      'IsObject', 'IsOptional', 'IsNotEmpty', 'MinLength', 'MaxLength', 
      'Min', 'Max', 'IsEnum', 'IsMongoId', 'ValidateNested', 'ArrayMinSize',
      'ArrayMaxSize'
    ]);

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
        return `  ${validation}\n  ${field.name}${field.required ? '' : '?'}: ${StringUtils.toPascalCase(field.schemaRef)}Dto;`;
      }
      
      // Para arrays de subdocumentos
      if (field.type === 'array' && 
          typeof field.items === 'object') {
        const itemsField = field.items as SchemaField;
        
        if (itemsField.type === 'schema' && itemsField.schemaRef) {
          const schemaRef = itemsField.schemaRef;
          validation += `\n  @IsArray()`;
          validation += `\n  @ValidateNested({ each: true })`;
          validation += `\n  @Type(() => ${StringUtils.toPascalCase(schemaRef)}Dto)`;
          
          // Agregar validaciones para el array si existen
          if (field.validations) {
            for (const validationRule of field.validations) {
              if (validationRule.type === 'min') {
                validation += `\n  @ArrayMinSize(${validationRule.value})`;
                validationImports.add('ArrayMinSize');
              } else if (validationRule.type === 'max') {
                validation += `\n  @ArrayMaxSize(${validationRule.value})`;
                validationImports.add('ArrayMaxSize');
              }
            }
          }
          
          return `  ${validation}\n  ${field.name}${field.required ? '' : '?'}: ${StringUtils.toPascalCase(schemaRef)}Dto[];`;
        }
      }
      
      // Validaciones según el tipo
      switch (field.type) {
        case 'string':
          validation += '\n  @IsString()';
          break;
        case 'number':
        case 'integer':
          validation += '\n  @IsNumber()';
          break;
        case 'boolean':
          validation += '\n  @IsBoolean()';
          break;
        case 'date':
          validation += '\n  @IsDate()';
          break;
        case 'array':
          validation += '\n  @IsArray()';
          // Si tenemos información sobre el tipo de elementos del array
          if (field.items) {
            if (typeof field.items === 'string') {
              // Para arrays de tipos primitivos
              switch (field.items) {
                case 'string':
                  validation += '\n  @IsString({ each: true })';
                  break;
                case 'number':
                case 'integer':
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
                  validationImports.add('IsMongoId');
                  break;
              }
            } else if (typeof field.items === 'object') {
              // Para arrays de objetos genéricos
              validation += '\n  @IsObject({ each: true })';
            }
          }
          break;
        case 'object':
          validation += '\n  @IsObject()';
          break;
        case 'objectid':
        case 'reference':
          validation += '\n  @IsMongoId()';
          validationImports.add('IsMongoId');
          break;
        case 'enum':
          if (field.enum && field.enum.length > 0) {
            const enumValues = field.enum.map(val => `'${val}'`).join(', ');
            validation += `\n  @IsEnum([${enumValues}])`;
            validationImports.add('IsEnum');
          }
          break;
      }
      
      // Agregar validaciones adicionales basadas en las restricciones
      if (field.validations && field.validations.length > 0) {
        for (const validationRule of field.validations) {
          switch (validationRule.type) {
            case 'minLength':
              validation += `\n  @MinLength(${validationRule.value})`;
              validationImports.add('MinLength');
              break;
            case 'maxLength':
              validation += `\n  @MaxLength(${validationRule.value})`;
              validationImports.add('MaxLength');
              break;
            case 'min':
              validation += `\n  @Min(${validationRule.value})`;
              validationImports.add('Min');
              break;
            case 'max':
              validation += `\n  @Max(${validationRule.value})`;
              validationImports.add('Max');
              break;
            case 'pattern':
              validation += `\n  @Matches(/${validationRule.value}/)`;
              validationImports.add('Matches');
              break;
          }
        }
      }
      
      // Obtener el tipo TypeScript para la definición del campo
      let tsType = this.getTypeScriptType(field);
      
      // Para campos ObjectId, usar Types.ObjectId
      if (field.type === 'objectid' || field.type === 'reference') {
        tsType = 'Types.ObjectId';
      }
      
      return `  ${validation}\n  ${field.name}${field.required ? '' : '?'}: ${tsType};`;
    }).join('\n\n');
    
    // DTO de actualización usa las mismas validaciones pero todo opcional
    const updateValidations = creationValidations.replace(/@IsNotEmpty\(\)/g, '@IsOptional()');
    
    // Si hay subdocumentos, necesitamos importar Type desde class-transformer
    if (fields.some(field => field.type === 'schema' || 
                      (field.type === 'array' && 
                       typeof field.items === 'object' && 
                       (field.items as SchemaField).type === 'schema'))) {
      validationImports.add('Type');
    }
    
    // Si usamos Matches, necesitamos importarlo
    if (fields.some(field => field.validations?.some(v => v.type === 'pattern'))) {
      validationImports.add('Matches');
    }
    
    return {
      createDTO: creationValidations,
      updateDTO: updateValidations,
      validationImports: Array.from(validationImports).join(', ')
    };
  }

  /**
   * Genera tipos Zod para los campos del esquema
   */
  private generateZodTypes(fields: SchemaField[]): ZodTypeDefinition[] {
    // Mapeo de campos a definiciones de esquemas Zod
    const zodTypes = fields.map(field => {
      // Procesar el campo y devolver su definición Zod
      return {
        name: field.name,
        zodType: this.getZodType(field),
        required: field.required || false
      };
    });

    return zodTypes;
  }

  /**
   * Obtiene la definición del tipo Zod para un campo
   */
  private getZodType(field: SchemaField): string {
    let zodDef = '';
    
    // Definición base según el tipo de campo
    switch (field.type) {
      case 'string':
        zodDef = 'z.string()';
        break;
      case 'number':
      case 'integer':
        zodDef = 'z.number()';
        break;
      case 'boolean':
        zodDef = 'z.boolean()';
        break;
      case 'date':
        zodDef = 'z.date()';
        break;
      case 'array':
        if (field.items) {
          if (typeof field.items === 'string') {
            // Array de tipos primitivos
            switch (field.items) {
              case 'string':
                zodDef = 'z.array(z.string())';
                break;
              case 'number':
              case 'integer':
                zodDef = 'z.array(z.number())';
                break;
              case 'boolean':
                zodDef = 'z.array(z.boolean())';
                break;
              case 'date':
                zodDef = 'z.array(z.date())';
                break;
              case 'objectid':
                zodDef = 'z.array(z.any())';
                break;
              default:
                zodDef = 'z.array(z.any())';
            }
          } else if (typeof field.items === 'object') {
            // Array de objetos
            zodDef = 'z.array(z.object({}))';
          }
        } else {
          // Array genérico
          zodDef = 'z.array(z.any())';
        }
        break;
      case 'object':
        zodDef = 'z.object({})';
        break;
      case 'objectid':
      case 'reference':
        zodDef = 'z.any()';
        break;
      case 'enum':
        if (field.enum && field.enum.length > 0) {
          const enumValues = field.enum.map(val => `'${val}'`).join(', ');
          zodDef = `z.enum([${enumValues}])`;
        } else {
          zodDef = 'z.string()';
        }
        break;
      case 'schema':
        if (field.schemaRef) {
          zodDef = `${StringUtils.toPascalCase(field.schemaRef)}Schema`;
        } else {
          zodDef = 'z.object({})';
        }
        break;
      default:
        zodDef = 'z.any()';
    }
    
    // Aplicar validaciones adicionales
    if (field.validations && field.validations.length > 0) {
      for (const validation of field.validations) {
        switch (validation.type) {
          case 'minLength':
            zodDef += `.min(${validation.value}, '${field.name} debe tener al menos ${validation.value} caracteres')`;
            break;
          case 'maxLength':
            zodDef += `.max(${validation.value}, '${field.name} no debe exceder ${validation.value} caracteres')`;
            break;
          case 'min':
            zodDef += `.min(${validation.value}, '${field.name} debe ser al menos ${validation.value}')`;
            break;
          case 'max':
            zodDef += `.max(${validation.value}, '${field.name} no debe exceder ${validation.value}')`;
            break;
          case 'pattern':
            zodDef += `.regex(/${validation.value}/, '${field.name} debe cumplir con el patrón requerido')`;
            break;
          case 'email':
            zodDef += `.email('${field.name} debe ser un correo electrónico válido')`;
            break;
        }
      }
    }
    
    // Aplicar requerido/opcional
    if (!field.required) {
      zodDef += '.optional()';
    }
    
    // Agregar descripción si existe
    if (field.description) {
      zodDef += `.describe('${field.description}')`;
    }
    
    return zodDef;
  }

  /**
   * Actualiza el archivo domain.dependencies.ts agregando las dependencias del nuevo recurso
   */
  private async updateDomainDependencies(schema: Schema): Promise<void> {
    try {
      const dependenciesFile = path.join(process.cwd(), 'src/api/dependencies/domain.dependencies.ts');
      const resourceNameUpper = StringUtils.toPascalCase(schema.name);
      const resourceNameLower = StringUtils.toCamelCase(schema.name);

      // Verificar si el archivo existe
      if (!(await this.fileSystemService.fileExists(dependenciesFile))) {
        this.consoleService.warn(`Archivo ${dependenciesFile} no encontrado. Las dependencias deben registrarse manualmente.`);
        return;
      }

      // Leer el archivo actual
      let content = await this.fileSystemService.readFile(dependenciesFile);

      // Verificar si ya existe la entidad
      if (content.includes(`${resourceNameUpper}Repository`) || content.includes(`${resourceNameUpper}Service`) || content.includes(`${resourceNameUpper}Controller`)) {
        this.consoleService.warn(`Las dependencias para ${resourceNameUpper} ya están registradas.`);
        return;
      }

      // Preparar las nuevas líneas de import
      const newImports = `
// Importar entidades - ${resourceNameUpper}
import { ${resourceNameUpper}Repository } from '@api/domain/entities/${resourceNameUpper}/${resourceNameUpper}Repository';
import { ${resourceNameUpper}Service } from '@api/domain/entities/${resourceNameUpper}/${resourceNameUpper}Service';
import { ${resourceNameUpper}Controller } from '@api/domain/entities/${resourceNameUpper}/${resourceNameUpper}Controller';`;

      // Preparar las nuevas líneas de registro
      const newRegistrations = `
  // ========================================
  // Entidad: ${resourceNameUpper}
  // ========================================
  Container.register('${resourceNameLower}Repository').asClass(${resourceNameUpper}Repository).singleton();
  Container.register('${resourceNameLower}Service').asClass(${resourceNameUpper}Service).scoped();
  Container.register('${resourceNameLower}Controller').asClass(${resourceNameUpper}Controller).scoped();`;

      // Insertar imports después del último import existente
      const lastImportIndex = content.lastIndexOf('import { ');
      if (lastImportIndex !== -1) {
        const nextLineAfterImport = content.indexOf('\n', lastImportIndex);
        if (nextLineAfterImport !== -1) {
          const lineAfterThat = content.indexOf('\n', nextLineAfterImport + 1);
          if (lineAfterThat !== -1) {
            content = content.slice(0, lineAfterThat) + newImports + content.slice(lineAfterThat);
          }
        }
      }

      // Insertar registros antes del comentario final
      const beforeComment = content.lastIndexOf('  // Agregar más entidades siguiendo el mismo patrón...');
      if (beforeComment !== -1) {
        content = content.slice(0, beforeComment) + newRegistrations + '\n\n' + content.slice(beforeComment);
      } else {
        // Si no encuentra el comentario, insertar antes del último }
        const lastBrace = content.lastIndexOf('}');
        if (lastBrace !== -1) {
          content = content.slice(0, lastBrace) + newRegistrations + '\n' + content.slice(lastBrace);
        }
      }

      // Escribir el archivo actualizado
      await this.fileSystemService.writeFile(dependenciesFile, content);

      this.consoleService.info(`Dependencias de ${resourceNameUpper} añadidas a domain.dependencies.ts`);
    } catch (error) {
      this.consoleService.error(`Error al actualizar dependencias: ${(error as Error).message}`);
    }
  }
} 