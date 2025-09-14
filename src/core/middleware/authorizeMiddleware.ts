import { Request, Response, NextFunction } from 'express';
import { useForbiddenError, useUnauthorizedError } from '@core/hooks/useError';
import { Role, rolePermissions } from '@core/security/roles';
import { Permission } from '@core/security/permissions';

// Mapeo de métodos HTTP a operaciones
const methodToOperation: Record<string, string> = {
  GET: 'read',
  POST: 'write',
  PUT: 'write',
  PATCH: 'write',
  DELETE: 'delete'
};

// Middleware para autorización basada en permisos
export const authorize = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(useUnauthorizedError('Usuario no autenticado'));
  }

  // Obtener la ruta y el método
  const url = req.originalUrl;
  const method = req.method;
  
  // Extraer el segmento de recurso (segundo segmento después de /api/)
  const urlParts = url.split('?')[0].split('/');
  // Asumimos que las rutas tienen el formato /api/recurso/...
  const resourceName = urlParts.length > 2 ? urlParts[2] : '';
  
  if (!resourceName) {
    // Si no hay recurso específico, permitimos el acceso (podría ser una ruta pública)
    return next();
  }
  
  // Determinar la operación basada en el método HTTP
  const operation = methodToOperation[method] || 'read';
  
  // Construir el permiso requerido (ej: "user:read")
  const requiredPermission = `${resourceName}:${operation}` as Permission;
  
  // Obtener el rol del usuario
  const userRole = req.user.role as Role;
  
  // Verificar si el rol tiene el permiso requerido
  const userPermissions = rolePermissions[userRole] || [];
  
  // El rol ADMIN tiene acceso a todo
  if (userRole === Role.ADMIN || userPermissions.includes(Permission.SYSTEM_ADMIN)) {
    return next();
  }
  
  // Verificar si el usuario tiene el permiso específico
  if (userPermissions.includes(requiredPermission as Permission)) {
    return next();
  }
  
  // Si llegamos aquí, el usuario no tiene permiso
  return next(useForbiddenError('No tiene permisos para realizar esta acción'));
}; 