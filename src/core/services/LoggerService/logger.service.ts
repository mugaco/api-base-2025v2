import winston from 'winston';
import { ILoggerService } from './logger.interface';

export class LoggerService implements ILoggerService {
  private logger: winston.Logger;
  private initialized = false;

  constructor() {
    // Solo configuración básica en constructor (síncrono)
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'api-base-2025',
        env: process.env.NODE_ENV || 'development'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Aquí van las operaciones asíncronas
    // Por ejemplo: crear directorios, verificar permisos, etc.
    
    // Agregar transports a archivo después de la inicialización
    this.logger.add(new winston.transports.File({ 
      filename: 'logs/combined.log'
    }));
    
    this.logger.add(new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }));

    this.initialized = true;
    this.info('LoggerService inicializado correctamente');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}