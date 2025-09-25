import { Request } from 'express';
import { IRequestContext } from '@core/interfaces/request-context.interface';

/**
 * Obtiene el contexto de la solicitud actual
 * @param req Objeto de solicitud Express
 * @returns El contexto de la solicitud
 * @throws Error si el contexto no está disponible
 */
export function useRequestContext(req: Request): IRequestContext {
  if (!req.context) {
    throw new Error('Request context not available. Ensure requestContextMiddleware is configured.');
  }
  return req.context;
}

/**
 * Obtiene el ID de transacción de la solicitud actual
 * @param req Objeto de solicitud Express
 * @returns El ID de transacción
 */
export function useTransactionId(req: Request): string {
  const context = useRequestContext(req);
  return context.transactionId;
}

/**
 * Obtiene los datos de la transacción actual
 * @param req Objeto de solicitud Express
 * @returns Los datos de la transacción
 */
export function useTransactionData(req: Request): Record<string, unknown> {
  const context = useRequestContext(req);
  return context.transactionData;
}

/**
 * Obtiene la información del usuario actual
 * @param req Objeto de solicitud Express
 * @returns La información del usuario o undefined si no hay usuario autenticado
 */
export function useCurrentUser(req: Request): { _id: string; role: string; [key: string]: unknown } | undefined {
  const context = useRequestContext(req);
  return context.user;
}

/**
 * Añade datos al contexto de la transacción actual
 * @param req Objeto de solicitud Express
 * @param key Clave para los datos
 * @param value Valor a almacenar
 */
export function addTransactionData(req: Request, key: string, value: unknown): void {
  const context = useRequestContext(req);
  context.addTransactionData(key, value);
}

/**
 * Obtiene un dato específico del contexto de la transacción
 * @param req Objeto de solicitud Express
 * @param key Clave del dato a obtener
 * @returns El valor almacenado o undefined si no existe
 */
export function getTransactionDataByKey(req: Request, key: string): unknown {
  const context = useRequestContext(req);
  return context.transactionData[key];
}

/**
 * Establece la información del usuario en el contexto actual
 * @param req Objeto de solicitud Express
 * @param userId ID del usuario
 * @param role Rol del usuario
 * @param additionalData Datos adicionales del usuario
 */
export function setUser(req: Request, userId: string, role: string, additionalData: Record<string, unknown> = {}): void {
  const context = useRequestContext(req);
  context.setUser(userId, role, additionalData);
}

// Exportamos también los nombres antiguos para mantener compatibilidad
export const getRequestContext = useRequestContext;
export const getTransactionId = useTransactionId;
export const getTransactionData = useTransactionData;
export const getCurrentUser = useCurrentUser; 