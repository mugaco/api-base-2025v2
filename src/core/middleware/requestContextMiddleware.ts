import { Request, Response, NextFunction } from 'express';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';
import { v4 as uuidv4 } from 'uuid';
import { addTransactionData, useTransactionId, useCurrentUser } from '@core/hooks/useRequestContext';


/**
 * Middleware que inicializa el contexto de solicitud para cada petición HTTP
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Obtener el LoggerService del contenedor (la instancia ya inicializada)
  const loggerService = Container.resolve<ILoggerService>('loggerService');

  // Crear un ID de transacción único para esta solicitud
  const transactionId = uuidv4();

  // Extraer información relevante de la solicitud
  const metadata = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    method: req.method,
    path: req.path,
    referrer: req.get('referrer'),
    contentType: req.get('content-type')
  };

  // Crear el objeto de contexto base
  req.context = {
    transactionId,
    startTime: Date.now(),
    transactionData: {},
    metadata,

    // Métodos para manipular el contexto
    addTransactionData(key: string, value: unknown): void {
      this.transactionData[key] = value;
    },

    setUser(userId: string, role: string, additionalData = {}): void {
      this.user = {
        _id: userId,
        role,
        ...additionalData
      };
    }
  };

  // Añadir el ID de transacción a las cabeceras de respuesta para trazabilidad
  res.setHeader('X-Transaction-ID', useTransactionId(req));

  // Registrar inicio de la transacción
  const start = process.hrtime();

  // Añadir información inicial a los datos de transacción usando el hook
  addTransactionData(req, 'requestStartedAt', new Date().toISOString());
  addTransactionData(req, 'requestMethod', req.method);
  addTransactionData(req, 'requestPath', req.path);

  // Log de inicio de transacción
  loggerService.debug(`Iniciando transacción: ${req.method} ${req.path}`, {
    transactionId: useTransactionId(req),
    method: req.method,
    path: req.path
  });

  // Función para calcular la duración
  const getDurationInMs = (): number => {
    const diff = process.hrtime(start);
    return (diff[0] * 1e9 + diff[1]) / 1e6;
  };

  // Registrar eventos de finalización
  res.on('finish', () => {
    // Calcular duración
    const durationMs = getDurationInMs();

    // Añadir información de finalización a los datos de transacción
    addTransactionData(req, 'responseStatusCode', res.statusCode);
    addTransactionData(req, 'responseDuration', `${durationMs.toFixed(2)}ms`);

    // Obtener usuario actual si existe
    const currentUser = useCurrentUser(req);
    const activity = req.scope?.resolve('activity');

    // Determinar si hay payload (body) relevante
    const hasPayload = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0;

    // Determinar si hay query params
    const hasQuery = req.query && Object.keys(req.query).length > 0;

    // Determinar si hay route params
    const hasParams = req.params && Object.keys(req.params).length > 0;

    // Registrar información de la transacción completada
    const logData: Record<string, unknown> = {
      transactionId: useTransactionId(req),
      statusCode: res.statusCode,
      duration: `${durationMs.toFixed(2)}ms`,
      userId: currentUser?._id,
      userRole: currentUser?.role,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      activity: activity ? activity.get() : []
    };

    // Añadir payload si existe (para POST, PUT, PATCH)
    if (hasPayload) {
      // Filtrar información sensible del body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeBody } = req.body;
      logData.payload = safeBody;
    }

    // Añadir query params si existen
    if (hasQuery) {
      logData.query = req.query;
    }

    // Añadir route params si existen
    if (hasParams) {
      logData.params = req.params;
    }

    loggerService.info(`Transacción completada: ${req.method} ${req.path}`, logData);
  });

  next();
} 