import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
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
        service: process.env.API_TITLE || 'api-base-2025',
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

    // Agregar transports de rotación diaria después de la inicialización
    this.logger.add(new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '200m',
      auditFile: 'logs/.audit-combined.json',
      // maxFiles: '30d', // ← ELIMINADO - No borra archivos automáticamente
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));

    this.logger.add(new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      auditFile: 'logs/.audit-error.json',
      // maxFiles: '90d', // ← ELIMINADO - No borra errores automáticamente
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
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