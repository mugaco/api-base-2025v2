import mongoose from 'mongoose';
import { ILoggerService } from '@core/services/LoggerService';
import dotenv from 'dotenv';

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

// Conectar a MongoDB
export const connectDB = async (logger: ILoggerService): Promise<void> => {
  try {
    // Mostrar la URL que se está utilizando (sin credenciales)
    const connectionString = MONGO_URI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://*****:*****@'
    );

    logger.info(`Intentando conectar a MongoDB: ${connectionString}`);

    const connection = await mongoose.connect(MONGO_URI, options);
    logger.info(`MongoDB conectado: ${connection.connection.host}`);

    // Manejadores de eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error(`Error de conexión MongoDB: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    // Manejo de cierre de la aplicación
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Conexión a MongoDB cerrada debido a la terminación de la aplicación');
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Error al conectar a MongoDB: ${error}`);
    throw error; // Propagar el error en lugar de salir del proceso
  }
}; 