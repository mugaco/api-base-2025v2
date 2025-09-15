/**
 * Comando para crear esquemas de recursos
 */
import * as path from 'path';
import { BaseCommand } from '../core/BaseCommand';
import { CommandOption, CommandOptions } from '../interfaces/CommandInterface';
import { ConsoleService, PromptService, FileSystemService } from '../interfaces/IOInterface';
import { Schema, SchemaField, DataType } from '../interfaces/SchemaInterface';
import { StringUtils } from '../utils/StringUtils';
import { CLIError } from '../core/CLIError';

/**
 * Implementación del comando para crear esquemas
 */
export class SchemaCommand extends BaseCommand {
  /**
   * Constructor del comando
   * @param consoleService Servicio de consola
   * @param promptService Servicio de entrada interactiva
   * @param fileSystem Servicio de sistema de archivos
   */
  constructor(
    consoleService: ConsoleService,
    promptService: PromptService,
    private readonly fileSystem: FileSystemService,
    private readonly schemasDir: string
  ) {
    super('schema', 'Crea un nuevo esquema para un recurso', consoleService, promptService);
  }

  /**
   * Obtiene las opciones del comando
   */
  public getOptions(): CommandOption[] {
    return [
      {
        name: 'output',
        alias: 'o',
        description: 'Directorio de salida para el esquema',
        type: 'string',
        required: false,
      },
      {
        name: 'name',
        alias: 'n',
        description: 'Nombre del esquema',
        type: 'string',
        required: false,
      },
      {
        name: 'force',
        alias: 'f',
        description: 'Sobrescribir el esquema si ya existe',
        type: 'boolean',
        default: false,
      },
    ];
  }

  /**
   * Ejecuta el comando
   * @param options Opciones del comando
   */
  protected async run(options: CommandOptions): Promise<void> {
    try {
      // Obtener la acción a realizar
      const action = this.getOption<string>(options, 'action', 'create');

      switch (action) {
        case 'create': {
          // Obtener nombre del recurso
          const name = options.name as string || await this.promptService.promptInput('Nombre del recurso (en singular)', { required: true });

          // Crear el esquema
          const schema = await this.createSchema(name);
          
          // Guardar el esquema
          await this.saveSchema(schema, this.getOption<boolean>(options, 'force', false));
          break;
        }
        
        default:
          throw new CLIError(this.name, `Acción desconocida: ${action}`);
      }
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      throw new CLIError(this.name, `Error al ejecutar el comando: ${(error as Error).message}`);
    }
  }

  /**
   * Crea un esquema de forma interactiva
   * @param name Nombre base del esquema
   */
  private async createSchema(name: string): Promise<Schema> {
    // Convertir el nombre a camelCase independientemente de cómo se pase
    const camelCaseName = StringUtils.toCamelCase(name);

    // Obtener información básica
    const description = await this.promptService.promptInput('Descripción del recurso (opcional)', {});

    // Obtener la ruta de API basada en la versión pluralizada del nombre en kebab-case
    const apiPath = await this.promptService.promptInput(
      'Ruta base API (opcional)',
      { default: StringUtils.toKebabCase(StringUtils.pluralize(camelCaseName)) }
    );

    // Obtener opciones adicionales
    const audit = await this.promptService.promptConfirm('¿Incluir campos de auditoría (createdAt, updatedAt)?', true);
    const softDelete = await this.promptService.promptConfirm('¿Implementar borrado lógico?', true);

    // Crear el esquema base
    const schema: Schema = {
      name: camelCaseName,
      description,
      fields: [],
      audit,
      softDelete,
      api: {
        path: apiPath,
        auth: true,
      },
    };

    // Solicitar definición de campos
    await this.defineFields(schema);

    return schema;
  }

  /**
   * Define los campos del esquema interactivamente
   * @param schema Esquema a modificar
   */
  private async defineFields(schema: Schema): Promise<void> {
    let addMoreFields = true;

    do {
      // Crear un nuevo campo
      const field = await this.defineField();

      // Agregar el campo al esquema
      schema.fields.push(field);

      // Preguntar si se desea agregar más campos
      addMoreFields = await this.promptService.promptConfirm('¿Agregar otro campo?', true);
    } while (addMoreFields);

    // Asegurarse de que haya al menos un campo
    if (schema.fields.length === 0) {
      throw new Error('El esquema debe tener al menos un campo');
    }
  }

  /**
   * Define un campo interactivamente
   */
  private async defineField(): Promise<SchemaField> {
    let isValidField = false;
    let field: SchemaField | null = null;

    while (!isValidField) {
      try {
        // Obtener nombre del campo
        const name = await this.promptService.promptInput('Nombre del campo', { required: true });

        if (!name) {
          this.consoleService.error('El nombre del campo no puede estar vacío. Por favor, inténtalo de nuevo.');
          continue;
        }

        if (!StringUtils.isValidVariableName(name)) {
          this.consoleService.error('El nombre del campo contiene caracteres no válidos. El nombre debe comenzar con una letra, $ o _, y solo puede contener letras, números, $ o _. No se permiten guiones medios ni espacios.');
          this.consoleService.info('Ejemplos válidos: nombreCampo, nombre_campo, $nombreCampo');
          continue;
        }

        // Obtener tipo de dato
        const type = await this.promptService.promptSelect<DataType>(
          'Tipo del campo',
          [
            { name: 'String (texto)', value: 'string' },
            { name: 'Number (número)', value: 'number' },
            { name: 'Boolean (verdadero/falso)', value: 'boolean' },
            { name: 'Date (fecha)', value: 'date' },
            { name: 'Array (arreglo)', value: 'array' },
            { name: 'Object (objeto)', value: 'object' },
            { name: 'Enum (enumeración)', value: 'enum' },
            { name: 'Reference (referencia a otro modelo)', value: 'objectid' },
            { name: 'Schema (subdocumento)', value: 'schema' },
          ]
        );

        // Obtener si es requerido
        const required = await this.promptService.promptConfirm('¿Es requerido?', false);

        // Obtener descripción
        const description = await this.promptService.promptInput('Descripción (opcional)', {});

        // Crear campo base
        field = {
          name,
          type,
          required,
          description,
        };

        // Configurar opciones específicas según el tipo
        await this.configureFieldByType(field);

        isValidField = true;
      } catch (error) {
        this.consoleService.error(`Error al definir el campo: ${(error as Error).message}`);
        const retry = await this.promptService.promptConfirm('¿Deseas intentarlo de nuevo?', true);
        if (!retry) {
          throw new Error('Operación cancelada por el usuario');
        }
      }
    }

    return field as SchemaField;
  }

  /**
   * Configura un campo según su tipo
   * @param field Campo a configurar
   */
  private async configureFieldByType(field: SchemaField): Promise<void> {
    switch (field.type) {
      case 'string':
        await this.configureStringField(field);
        break;

      case 'number':
        await this.configureNumberField(field);
        break;

      case 'boolean':
        await this.configureBooleanField(field);
        break;

      case 'date':
        await this.configureDateField(field);
        break;

      case 'array':
        await this.configureArrayField(field);
        break;

      case 'enum':
        await this.configureEnumField(field);
        break;

      case 'objectid':
        await this.configureReferenceField(field);
        break;

      case 'schema':
        await this.configureSchemaField(field);
        break;
    }
  }

  /**
   * Configura un campo de tipo string
   * @param field Campo a configurar
   */
  private async configureStringField(field: SchemaField): Promise<void> {
    const minLength = await this.promptService.promptInput('Longitud mínima (opcional)', {});
    if (minLength && !isNaN(Number(minLength))) {
      field.validations = field.validations || [];
      field.validations.push({
        type: 'minLength',
        value: Number(minLength),
      });
    }

    const maxLength = await this.promptService.promptInput('Longitud máxima (opcional)', {});
    if (maxLength && !isNaN(Number(maxLength))) {
      field.validations = field.validations || [];
      field.validations.push({
        type: 'maxLength',
        value: Number(maxLength),
      });
    }

    const pattern = await this.promptService.promptInput('Patrón regex (opcional)', {});
    if (pattern) {
      field.validations = field.validations || [];
      field.validations.push({
        type: 'pattern',
        value: pattern,
      });
    }

    const unique = await this.promptService.promptConfirm('¿Debe ser único?', false);
    if (unique) {
      field.meta = field.meta || {};
      field.meta.unique = true;
    }
  }

  /**
   * Configura un campo de tipo number
   * @param field Campo a configurar
   */
  private async configureNumberField(field: SchemaField): Promise<void> {
    const min = await this.promptService.promptInput('Valor mínimo (opcional)', {});
    if (min && !isNaN(Number(min))) {
      field.validations = field.validations || [];
      field.validations.push({
        type: 'min',
        value: Number(min),
      });
    }

    const max = await this.promptService.promptInput('Valor máximo (opcional)', {});
    if (max && !isNaN(Number(max))) {
      field.validations = field.validations || [];
      field.validations.push({
        type: 'max',
        value: Number(max),
      });
    }

    const defaultValue = await this.promptService.promptInput('Valor por defecto (opcional)', {});
    if (defaultValue && !isNaN(Number(defaultValue))) {
      field.default = Number(defaultValue);
    }
  }

  /**
   * Configura un campo de tipo boolean
   * @param field Campo a configurar
   */
  private async configureBooleanField(field: SchemaField): Promise<void> {
    const defaultValue = await this.promptService.promptConfirm('Valor por defecto', false);
    field.default = defaultValue;
  }

  /**
   * Configura un campo de tipo date
   * @param field Campo a configurar
   */
  private async configureDateField(field: SchemaField): Promise<void> {
    const useCurrentDate = await this.promptService.promptConfirm('¿Usar fecha actual como valor por defecto?', false);
    if (useCurrentDate) {
      field.default = 'Date.now()';
    }
  }

  /**
   * Configura un campo de tipo array
   * @param field Campo a configurar
   */
  private async configureArrayField(field: SchemaField): Promise<void> {
    // Obtener el tipo de elementos del array
    const itemsType = await this.promptService.promptSelect<DataType>(
      'Tipo de elementos del array',
      [
        { name: 'String (texto)', value: 'string' },
        { name: 'Number (número)', value: 'number' },
        { name: 'Boolean (verdadero/falso)', value: 'boolean' },
        { name: 'Date (fecha)', value: 'date' },
        { name: 'Object (objeto)', value: 'object' },
        { name: 'Reference (referencia a otro modelo)', value: 'objectid' },
      ]
    );

    // Establecer el tipo de elementos
    field.arrayOf = itemsType;

    // Si es de tipo reference, solicitar la referencia
    if (itemsType === 'objectid') {
      const reference = await this.promptService.promptInput('Nombre del modelo al que hace referencia', {});
      field.ref = reference;
    }
  }

  /**
   * Configura un campo de tipo enum
   * @param field Campo a configurar
   */
  private async configureEnumField(field: SchemaField): Promise<void> {
    const enumValues = await this.promptService.promptInput('Valores separados por coma (ej: admin,editor,user)', { required: true });
    
    // Convertir la cadena a un array de valores
    const values = enumValues.split(',').map(value => value.trim()).filter(value => value.length > 0);
    
    if (values.length === 0) {
      throw new Error('Debes especificar al menos un valor para el enum');
    }
    
    field.enum = values;
  }

  /**
   * Configura un campo de tipo objectid (referencia)
   * @param field Campo a configurar
   */
  private async configureReferenceField(field: SchemaField): Promise<void> {
    const reference = await this.promptService.promptInput('Nombre del modelo al que hace referencia', { required: true });
    field.ref = reference;
  }

  /**
   * Configura un campo de tipo schema (subdocumento)
   * @param field Campo a configurar
   */
  private async configureSchemaField(field: SchemaField): Promise<void> {
    const schemaRef = await this.selectExistingSchema();

    if (!schemaRef) {
      throw new Error('Debe seleccionar un esquema para el subdocumento');
    }

    field.schemaRef = schemaRef;
  }

  /**
   * Selecciona un esquema existente
   * @returns Nombre del esquema seleccionado
   */
  private async selectExistingSchema(): Promise<string | undefined> {
    try {
      // Listar archivos de esquema
      const schemaFiles = await this.fileSystem.listFiles(this.schemasDir, /\.json$/);

      if (schemaFiles.length === 0) {
        this.consoleService.warn('No hay esquemas disponibles. Debe crear al menos un esquema primero.');
        return undefined;
      }

      // Crear opciones para el selector
      const schemaOptions = schemaFiles.map(file => {
        const fileName = path.basename(file, '.json');
        return {
          name: fileName,
          value: fileName
        };
      });

      // Solicitar selección al usuario
      return await this.promptService.promptSelect<string>(
        'Selecciona el esquema a usar como subdocumento',
        schemaOptions
      );
    } catch (error) {
      this.consoleService.error(`Error al seleccionar el esquema: ${(error as Error).message}`);
      return undefined;
    }
  }

  /**
   * Guarda el esquema en un archivo
   * @param schema Esquema a guardar
   * @param force Indica si se debe sobrescribir el archivo si ya existe 
   */
  private async saveSchema(schema: Schema, force: boolean = false): Promise<void> {
    // Asegurarse de que el nombre esté en camelCase
    schema.name = StringUtils.toCamelCase(schema.name);

    // Construir el nombre del archivo
    const fileName = `${schema.name}.json`;
    const filePath = path.join(this.schemasDir, fileName);

    // Verificar si el archivo ya existe
    const exists = await this.fileSystem.fileExists(filePath);

    if (exists && !force) {
      const overwrite = await this.promptService.promptConfirm(
        `El esquema '${fileName}' ya existe. ¿Desea sobrescribirlo?`,
        false
      );

      if (!overwrite) {
        this.consoleService.info(`El esquema no ha sido guardado. Operación cancelada.`);
        return;
      }
    }

    // Asegurarse de que el directorio exista
    await this.fileSystem.mkdir(this.schemasDir);

    // Guardar el esquema
    await this.fileSystem.writeJsonFile(filePath, schema, { spaces: 2, overwrite: true });

    this.consoleService.success(`Esquema guardado en '${filePath}'`);
  }

  /**
   * Verifica si un nombre es un identificador válido
   * @param name Nombre a verificar
   */
  private isValidVariableName(name: string): boolean {
    return StringUtils.isValidVariableName(name);
  }
} 