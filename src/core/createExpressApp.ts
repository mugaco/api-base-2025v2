// src/core/createExpressApp.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRoutes } from '../routes';
import { Container } from './Container';
import { ILoggerService } from './services/LoggerService';
import { scopeMiddleware } from './middleware/scopeMiddleware';
import { requestContextMiddleware } from './middleware/requestContextMiddleware';
import { useTransactionId, useCurrentUser, addTransactionData } from '@core/hooks/useRequestContext';

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

  // Middleware de contexto de solicitud - IMPORTANTE: debe ser el primero
  app.use(requestContextMiddleware);

  // Middleware básico
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());
  app.use(helmet());

  // Middleware de scope de Awilix - IMPORTANTE: debe ir antes de las rutas
  app.use(scopeMiddleware);

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

    // Obtener información del contexto usando los hooks
    const transactionId = useTransactionId(req);
    const currentUser = useCurrentUser(req);
    addTransactionData(req, 'error', err.message);
    addTransactionData(req, 'errorCode', errorCode);
    addTransactionData(req, 'errorStatusCode', statusCode);

    // Log del error usando LoggerService con contexto enriquecido
    logger.error(`Error ${statusCode}: ${err.message}`, {
      code: errorCode,
      stack: err.stack,
      path: req.path,
      transactionId,
      userId: currentUser?._id,
      userRole: currentUser?.role
    });

    // Respuesta base con transactionId
    const errorResponse: Record<string, unknown> = {
      status: 'error',
      code: errorCode,
      message: isOperational ? err.message : 'Error interno del servidor',
      transactionId
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