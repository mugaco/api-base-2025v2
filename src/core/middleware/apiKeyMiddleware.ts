import { Request, Response, NextFunction } from 'express';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Middleware para validar API Keys en rutas públicas del CMS
 * Las API Keys se configuran en variables de entorno
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const logger = Container.resolve<ILoggerService>('loggerService');
  try {
    // Obtener API Key desde headers (X-API-Key o X-Api-Key)
    const apiKey = req.headers['x-api-key'] || req.headers['x-Api-Key'];
    
    if (!apiKey || typeof apiKey !== 'string') {
      res.status(401).json({
        status: 'error',
        code: 'API_KEY_REQUIRED',
        message: 'API Key requerida en header X-API-Key'
      });
      return;
    }
    
    // Obtener claves válidas desde variables de entorno (separadas por comas)
    const rawKeys = process.env.CMS_PUBLIC_API_KEYS;
    // console.log('🔍 DEBUG - Variable CMS_PUBLIC_API_KEYS:', rawKeys);
    
    const validApiKeys = rawKeys?.split(',').map(key => key.trim()) || [];
    // console.log('🔍 DEBUG - API Keys procesadas:', validApiKeys);
    
    if (validApiKeys.length === 0) {
      // console.warn('⚠️  No hay API Keys configuradas en CMS_PUBLIC_API_KEYS');
      res.status(503).json({
        status: 'error',
        code: 'API_KEYS_NOT_CONFIGURED',
        message: 'API Keys no configuradas en el servidor'
      });
      return;
    }
    
    // Validar que la API Key existe en la lista
    if (!validApiKeys.includes(apiKey)) {
      res.status(401).json({
        status: 'error',
        code: 'INVALID_API_KEY',
        message: 'API Key inválida'
      });
      return;
    }
    
    // API Key válida, continuar
    next();
    
  } catch (error) {
    logger.error('Error en apiKeyMiddleware', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor'
    });
  }
};