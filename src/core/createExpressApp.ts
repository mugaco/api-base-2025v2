// src/core/createExpressApp.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRoutes } from '../routes';
import { Container } from './Container';
import { ILoggerService } from './services/LoggerService';

// Interfaces para errores personalizados
interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  errors?: unknown[];
}

export function createExpressApp(): Application {
  const app: Application = express();
  
  // Obtener el LoggerService del contenedor
  const logger = Container.resolve<ILoggerService>('loggerService');

  // Configuración para confiar en los headers cuando se usa detrás de un proxy como Traefik
  app.set('trust proxy', true);

  // Middleware básico
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());
  app.use(helmet());

  // Ruta básica de health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Usar las rutas definidas en routes.ts
  app.use('/api', apiRoutes);

  // Middleware para manejar rutas no encontradas (404)
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: 'Ruta no encontrada',
      code: 'NOT_FOUND'
    });
  });

  // Middleware para manejar errores generales
  app.use((err: ApiError, req: Request, res: Response, _next: NextFunction) => {
    // Valores por defecto
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const isOperational = err.isOperational || false;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log del error usando LoggerService
    logger.error(`Error ${statusCode}: ${err.message}`, {
      code: errorCode,
      stack: err.stack,
      path: req.path
    });

    // Respuesta base
    const errorResponse: Record<string, unknown> = {
      status: 'error',
      code: errorCode,
      message: isOperational ? err.message : 'Error interno del servidor'
    };

    // Añadir los errores detallados si existen
    if (err.errors) {
      errorResponse.errors = err.errors;
    }

    // En desarrollo, incluimos información adicional para depuración
    if (isDevelopment) {
      errorResponse.stack = err.stack;

      if (!isOperational) {
        errorResponse.raw_message = err.message;
      }
    }

    res.status(statusCode).json(errorResponse);
  });

  return app;
}