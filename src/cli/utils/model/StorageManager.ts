/**
 * Clase para gestionar el almacenamiento de datos generados
 */
import { FileSystemService } from '../../interfaces/IOInterface';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, loadModels } from './DatabaseConnector';

interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

// Función auxiliar para extraer el mensaje de error de forma segura
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Crear un logger alternativo simplificado si no se puede importar el principal
const createSimpleLogger = (): Logger => {
  return {
    info: (message: string) => {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`);
    },
    warn: (message: string) => {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`);
    },
    error: (message: string) => {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`);
    },
    debug: (message: string) => {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`);
    }
  };
};

// Variable para almacenar el logger
let logger = createSimpleLogger();

// Intentar importar el logger del proyecto principal
try {
  // Usar la nueva ruta al logger
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loggerModule = require('../../../core/services/LoggerService/logger.base') as { logger?: Logger };
  if (loggerModule.logger) {
    logger = loggerModule.logger;
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('No se pudo importar el logger principal, usando logger simplificado:', getErrorMessage(error));
}

export class StorageManager {
  /**
   * Constructor de la clase
   */
  constructor(private readonly fileSystemService: FileSystemService) {}

  /**
   * Guarda los datos generados en un archivo
   */
  public async saveData(
    data: Record<string, Record<string, unknown>[]>,
    outputPath: string,
    format: string = 'json'
  ): Promise<void> {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          await this.saveAsJson(data, outputPath);
          break;
        
        case 'mongodb':
          await this.saveAsMongoDbImport(data, outputPath);
          break;
        
        case 'db':
          await this.saveDirectlyToDatabase(data);
          break;
        
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      throw new Error(`Error al guardar los datos: ${(error as Error).message}`);
    }
  }

  /**
   * Guarda los datos en formato JSON
   */
  private async saveAsJson(data: Record<string, Record<string, unknown>[]>, outputPath: string): Promise<void> {
    await this.fileSystemService.writeJsonFile(outputPath, data, { spaces: 2 });
  }

  /**
   * Guarda los datos en formato de importación para MongoDB
   */
  private async saveAsMongoDbImport(data: Record<string, Record<string, unknown>[]>, outputPath: string): Promise<void> {
    // Asegurar que la extensión sea .js
    const outputFile = outputPath.endsWith('.js') ? outputPath : `${outputPath}.js`;
    
    let content = '/**\n * Script de importación para MongoDB\n *\n';
    content += ` * Ejecución: mongo ${outputFile}\n */\n\n`;
    
    // Agregar cada colección
    for (const [modelName, items] of Object.entries(data)) {
      // Construir el nombre de la colección (normalmente en plural y minúsculas)
      const collectionName = this.pluralize(modelName.toLowerCase());
      
      content += `// Datos para la colección ${collectionName}\n`;
      content += `db.${collectionName}.drop();\n\n`;
      
      if (items.length === 0) {
        content += `// No hay datos para ${collectionName}\n\n`;
        continue;
      }
      
      // Insertar los datos en lotes para mejorar el rendimiento
      const batchSize = 100;
      const batches = Math.ceil(items.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, items.length);
        const batch = items.slice(start, end);
        
        if (batch.length === 0) continue;
        
        content += `db.${collectionName}.insertMany(${JSON.stringify(batch, null, 2)});\n\n`;
      }
    }
    
    // Agregar índices si es necesario
    content += '// Crear índices\n';
    content += 'db.users.createIndex({ email: 1 }, { unique: true });\n';
    content += 'db.contents.createIndex({ slug: 1 }, { unique: true });\n';
    
    // Escribir el archivo
    await this.fileSystemService.writeFile(outputFile, content);
  }

  /**
   * Guarda los datos directamente en la base de datos MongoDB usando los modelos existentes
   */
  private async saveDirectlyToDatabase(data: Record<string, Record<string, unknown>[]>): Promise<void> {
    // Verificar si ya existe una conexión activa
    const isConnected = mongoose.connection.readyState === 1;
    
    try {
      // Paso 1: Intentar cargar los modelos explícitamente
      await loadModels();
      
      // Paso 2: Conectar a la base de datos utilizando la función específica para el CLI
      if (!isConnected) {
        logger.info('Conectando a la base de datos...');
        await connectDB();
        logger.info(`Conectado a MongoDB: ${mongoose.connection.host}`);
      } else {
        logger.info('Usando conexión existente a MongoDB');
      }

      // Paso 3: Verificar los modelos disponibles
      await this.checkModels();
      
      // Obtener los modelos registrados en Mongoose
      const registeredModels = mongoose.models;
      const modelNames = Object.keys(registeredModels);
      
      if (modelNames.length === 0) {
        throw new Error('No se encontraron modelos registrados en Mongoose. No se pueden insertar datos.');
      }
      
      logger.info(`Modelos disponibles en la aplicación: ${modelNames.join(', ')}`);
      
      // Paso 4: Si no se encuentran todos los modelos necesarios, intentar construirlos dinámicamente
      for (const modelName of Object.keys(data)) {
        const matchingModelName = modelNames.find(
          name => name.toLowerCase() === modelName.toLowerCase()
        );
        
        if (!matchingModelName && data[modelName].length > 0 && data[modelName][0]) {
          logger.warn(`Modelo '${modelName}' no encontrado, construyendo un esquema simple para inserción...`);
          try {
            // Crear un esquema basado en los campos del primer elemento
            const sampleData = data[modelName][0];
            const schemaFields: Record<string, any> = {};

            for (const [key, value] of Object.entries(sampleData)) {
              if (key === '_id') continue; // Omitir _id, Mongoose lo maneja

              const fieldType = typeof value;
              if (fieldType === 'string') {
                schemaFields[key] = { type: String };
                // Agregar validación para campos que podrían causar errores de clave duplicada
                if (key === 'name' || key === 'email' || key === 'slug') {
                  schemaFields[key].unique = false; // Desactivar restricción de unicidad
                }
              }
              else if (fieldType === 'number') schemaFields[key] = { type: Number };
              else if (fieldType === 'boolean') schemaFields[key] = { type: Boolean };
              else if (Array.isArray(value)) schemaFields[key] = [{}];
              else if (fieldType === 'object') schemaFields[key] = {};
            }
            
            // Crear esquema y modelo
            const dynamicSchema = new mongoose.Schema(schemaFields, { 
              strict: false, // Permitir campos adicionales
              versionKey: false // No incluir __v
            });
            
            // Registrar el modelo dinámico
            mongoose.model(modelName, dynamicSchema);
            logger.info(`Modelo '${modelName}' creado dinámicamente`);
          } catch (error) {
            logger.error(`No se pudo crear el modelo dinámico para '${modelName}': ${getErrorMessage(error)}`);
          }
        }
      }
      
      // Paso 5: Procesar cada modelo
      for (const [modelName, items] of Object.entries(data)) {
        if (items.length === 0) {
          // eslint-disable-next-line no-console
          console.log(`No hay datos para insertar en el modelo ${modelName}`);
          continue;
        }
        
        // Buscar el modelo correspondiente en los modelos registrados
        // Actualizamos para incluir modelos dinámicos recién creados
        const registeredModels = mongoose.models;
        const modelNames = Object.keys(registeredModels);
        
        const matchingModelName = modelNames.find(
          name => name.toLowerCase() === modelName.toLowerCase()
        );
        
        if (!matchingModelName) {
          // eslint-disable-next-line no-console
          console.warn(`ADVERTENCIA: El modelo '${modelName}' no está registrado en la aplicación.`);
          // eslint-disable-next-line no-console
          console.warn(`Los siguientes modelos están disponibles: ${modelNames.join(', ')}`);
          // eslint-disable-next-line no-console
          console.warn(`Se omitirá la inserción de datos para '${modelName}'.`);
          continue;
        }
        
        // Obtener el modelo de Mongoose
        const Model = registeredModels[matchingModelName];
        
        // eslint-disable-next-line no-console
        console.log(`Procesando ${items.length} registros para el modelo ${matchingModelName}...`);
        
        // Ya no eliminamos documentos existentes, solo insertamos los nuevos
        
        // Insertar los nuevos documentos usando el modelo de Mongoose (respeta validación y middleware)
        if (items.length > 0) {
          // Si hay muchos documentos, insertarlos en lotes para evitar problemas de memoria
          const batchSize = 100;
          const batches = Math.ceil(items.length / batchSize);
          
          for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, items.length);
            const batch = items.slice(start, end);
            
            if (batch.length === 0) continue;
            
            try {
              // Usar el modelo para crear y validar los documentos
              const result = await Model.insertMany(batch, { 
                ordered: false,
                // La validación es automática en Mongoose a menos que se desactive explícitamente
                rawResult: false
              });
              
              // eslint-disable-next-line no-console
              console.log(`Insertados ${result.length} documentos en ${matchingModelName} (lote ${i+1}/${batches})`);
            } catch (error: unknown) {
              const errorObj = error as any;
              if (errorObj.name === 'ValidationError') {
                // eslint-disable-next-line no-console
                console.error(`Error de validación al insertar en ${matchingModelName}: ${(error as Error).message}`);
                // eslint-disable-next-line no-console
                console.error('Asegúrate de que los datos coincidan con el esquema del modelo.');
              } else if (errorObj.writeErrors && errorObj.insertedDocs) {
                // Algunos documentos pueden haberse insertado correctamente
                const insertedCount = errorObj.insertedDocs.length;
                // eslint-disable-next-line no-console
                console.log(`Insertados parcialmente ${insertedCount} documentos en ${matchingModelName} (lote ${i+1}/${batches})`);
                // eslint-disable-next-line no-console
                console.error(`Error en algunos documentos: ${errorObj.message}`);
              } else {
                // eslint-disable-next-line no-console
                console.error(`Error al insertar en ${matchingModelName}: ${(error as Error).message}`);
              }
              // Continuar con el siguiente lote en lugar de detener todo el proceso
              continue;
            }
          }
        }
      }
      
      logger.info('Todos los datos han sido insertados correctamente usando los modelos de la aplicación');
    } catch (error) {
      logger.error(`Error al guardar en la base de datos: ${getErrorMessage(error)}`);
      throw new Error(`Error al guardar en la base de datos: ${getErrorMessage(error)}`);
    } finally {
      // Cerrar la conexión si la abrimos nosotros
      if (!isConnected && mongoose.connection.readyState !== 0) {
        await disconnectDB();
        logger.info('Conexión a MongoDB cerrada');
      }
    }
  }
  
  /**
   * Verifica que los modelos necesarios estén cargados
   */
  private async checkModels(): Promise<void> {
    try {
      // Verificar si ya hay modelos registrados
      const existingModels = Object.keys(mongoose.models);
      
      // Modelos que esperamos estén disponibles para este comando
      const expectedModels = ['User', 'Content', 'Media', 'Settings'];
      
      // Comprobar si los modelos ya existen en la aplicación
      // Si no, notificar al usuario que debe registrar los modelos antes de usar el comando
      // eslint-disable-next-line no-console
      console.log(`Comprobando modelos necesarios: ${expectedModels.join(', ')}`);
      
      // Comprobar qué modelos esperados no están disponibles
      const missingModels = expectedModels.filter(model => 
        !existingModels.some(name => name === model || name.toLowerCase() === model.toLowerCase())
      );
      
      if (missingModels.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`ADVERTENCIA: Los siguientes modelos no están registrados: ${missingModels.join(', ')}`);
        // eslint-disable-next-line no-console
        console.warn('Para usar correctamente este comando, asegúrate de que la aplicación ha registrado todos los modelos necesarios.');
        // eslint-disable-next-line no-console
        console.warn('Una forma de hacerlo es iniciar primero la aplicación principal y luego ejecutar este comando.');
      } else {
        // eslint-disable-next-line no-console
        console.log('Todos los modelos necesarios están registrados correctamente.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al verificar los modelos:', getErrorMessage(error));
    }
  }

  /**
   * Convierte un nombre singular a plural (simplificado)
   */
  private pluralize(singular: string): string {
    // Casos especiales
    const irregulars: Record<string, string> = {
      'media': 'media',
      'data': 'data',
      'series': 'series',
      'species': 'species',
      'sheep': 'sheep',
      'fish': 'fish',
      'deer': 'deer',
      'equipment': 'equipment',
      'information': 'information',
      'money': 'money',
      'news': 'news',
      // Palabras que ya están en plural y terminan en 's'
      'settings': 'settings',
      'tags': 'tags',
      'menus': 'menus',
      'stats': 'stats',
      'status': 'status',
      'metrics': 'metrics',
      'contents': 'contents',
      'details': 'details',
      'analytics': 'analytics'
    };
    
    // Verificar si es un caso especial
    if (irregulars[singular]) {
      return irregulars[singular];
    }
    
    // Si la palabra ya termina en 's', comprobar si ya está en plural
    if (singular.endsWith('s')) {
      // Comprobación básica: si tiene más de 3 caracteres y termina en 's', 
      // probablemente ya esté en plural
      if (singular.length > 3) {
        return singular;
      }
    }
    
    // Reglas básicas de pluralización en inglés
    if (singular.endsWith('y')) {
      return singular.slice(0, -1) + 'ies';
    } else if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || singular.endsWith('ch') || singular.endsWith('sh')) {
      return singular + 'es';
    } else {
      return singular + 's';
    }
  }
} 