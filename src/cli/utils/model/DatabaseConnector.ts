import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Importar el logger (si está disponible) o usar uno alternativo
let logger: any;

try {
  // Intentar importar el logger de la aplicación
  const loggerPath = path.resolve(process.cwd(), 'src/core/services/LoggerService/logger.base.ts');
  
  if (fs.existsSync(loggerPath)) {
    // Si esto falla, caeremos en el bloque catch
    const loggerModule = require('../../../core/services/LoggerService/logger.base');
    logger = loggerModule.logger;
  } else {
    throw new Error('Logger no encontrado');
  }
} catch (error) {
  // Crear un logger simplificado si no podemos importar el original
  logger = {
    info: (message: string) => console.log(`[INFO] ${message}`),
    warn: (message: string) => console.warn(`[WARN] ${message}`),
    error: (message: string) => console.error(`[ERROR] ${message}`),
    debug: (message: string) => console.debug(`[DEBUG] ${message}`)
  };
}

// Cargar variables de entorno
dotenv.config();

// URL de conexión de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cms-2025';

// Opciones de conexión
const options = {
  autoIndex: true, // Crea índices en desarrollo
  serverSelectionTimeoutMS: 5000, // Tiempo de espera para selección de servidor
  socketTimeoutMS: 45000, // Cierra sockets después de 45 segundos de inactividad
};

/**
 * Función para conectar a MongoDB específicamente para el CLI
 */
export async function connectDB(): Promise<void> {
  try {
    // Mostrar la URL que se está utilizando (sin credenciales)
    const connectionString = MONGO_URI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://*****:*****@'
    );
    
    logger.info(`[CLI] Intentando conectar a MongoDB: ${connectionString}`);
    
    const connection = await mongoose.connect(MONGO_URI, options);
    logger.info(`[CLI] MongoDB conectado: ${connection.connection.host}`);
    
    // Manejadores de eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error(`[CLI] Error de conexión MongoDB: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('[CLI] MongoDB desconectado');
    });
  } catch (error) {
    logger.error(`[CLI] Error al conectar a MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    throw error; // Propagar el error
  }
}

/**
 * Función para desconectar de MongoDB
 */
export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('[CLI] Conexión a MongoDB cerrada');
    }
  } catch (error) {
    logger.error(`[CLI] Error al desconectar de MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Función para cargar modelos explícitamente
 */
export async function loadModels(): Promise<number> {
  try {
    // Intentar cargar los modelos requeridos
    const modelsPath = path.join(process.cwd(), 'src', 'api', 'domain', 'entities');
    
    // Verificar si el directorio existe
    if (fs.existsSync(modelsPath)) {
      // Leer todos los directorios en entities (cada uno es un recurso)
      const entities = fs.readdirSync(modelsPath).filter(
        dir => fs.statSync(path.join(modelsPath, dir)).isDirectory()
      );
      
      logger.info(`[CLI] Cargando modelos desde: ${modelsPath}`);
      logger.info(`[CLI] Recursos encontrados: ${entities.join(', ')}`);
      
      // Cargar cada modelo mediante require directo o creando un modelo dinámico
      let modelsLoaded = 0;
      
      for (const resource of entities) {
        const modelPath = path.join(modelsPath, resource, 'model.ts');
        const modelJsPath = path.join(modelsPath, resource, 'model.js');
        
        // Verificar si existen los archivos del modelo
        const modelFile = fs.existsSync(modelPath) ? modelPath : 
                         (fs.existsSync(modelJsPath) ? modelJsPath : null);
        
        if (modelFile) {
          try {
            // Intentar cargar el modelo
            require(modelFile);
            logger.info(`[CLI] Modelo cargado: ${resource}`);
            modelsLoaded++;
          } catch (err) {
            logger.warn(`[CLI] Error al cargar el modelo ${resource}: ${err instanceof Error ? err.message : String(err)}`);
            
            // Intentar crear un modelo básico a partir del esquema
            try {
              const schemaPath = path.join(modelsPath, resource, 'schema.ts');
              const schemaJsPath = path.join(modelsPath, resource, 'schema.js');
              
              const schemaFile = fs.existsSync(schemaPath) ? schemaPath : 
                               (fs.existsSync(schemaJsPath) ? schemaJsPath : null);
              
              if (schemaFile) {
                logger.info(`[CLI] Intentando crear modelo a partir del esquema para ${resource}...`);
                
                // Crear un esquema básico si no existe ya
                const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
                
                if (!mongoose.models[resourceName]) {
                  const schema = new mongoose.Schema({}, { 
                    strict: false,
                    versionKey: false,
                    collection: resource.toLowerCase() + 's'
                  });
                  
                  mongoose.model(resourceName, schema);
                  logger.info(`[CLI] Modelo básico creado para: ${resourceName}`);
                  modelsLoaded++;
                }
              }
            } catch (schemaErr) {
              logger.warn(`[CLI] Error al crear modelo básico para ${resource}: ${schemaErr instanceof Error ? schemaErr.message : String(schemaErr)}`);
            }
          }
        }
      }
      
      logger.info(`[CLI] Total de modelos cargados: ${modelsLoaded} de ${entities.length}`);
      return modelsLoaded;
    } else {
      logger.warn(`[CLI] El directorio de recursos no existe: ${modelsPath}`);
      return 0;
    }
  } catch (error) {
    logger.warn(`[CLI] Error al cargar modelos: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
} 