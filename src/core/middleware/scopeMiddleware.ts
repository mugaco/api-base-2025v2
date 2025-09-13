/**
 * Middleware para crear un scope de Awilix por request
 * Permite tener instancias aisladas de servicios por petición HTTP
 */
import { Request, Response, NextFunction } from 'express';
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

/**
 * Extender la interfaz Request de Express para incluir el scope
 * Usando module augmentation en lugar de namespace
 */
declare module 'express-serve-static-core' {
  interface Request {
    scope?: AwilixContainer;
  }
}

/**
 * Middleware que crea un scope de Awilix para cada request
 * Esto permite que servicios marcados como 'scoped' tengan una instancia única por request
 *
 * @example
 * // En tu archivo de configuración de Express:
 * app.use(scopeMiddleware);
 *
 * // En tus controladores puedes usar:
 * const service = req.scope.resolve('myService');
 */
export function scopeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Crear un scope hijo del contenedor principal
  req.scope = Container.createScope();

  // Opcionalmente, podemos agregar valores específicos del request al scope
  // Por ejemplo, el usuario actual, el ID de la transacción, etc.
  // req.scope.register({
  //   currentUser: asValue(req.user),
  //   requestId: asValue(req.id)
  // });

  next();
}

/**
 * Middleware para limpiar el scope después de procesar la request
 * Opcional pero recomendado para evitar memory leaks
 */
export function cleanupScopeMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  // El scope se limpia automáticamente cuando sale de scope (garbage collection)
  // pero podemos forzar la limpieza si es necesario
  next();
}