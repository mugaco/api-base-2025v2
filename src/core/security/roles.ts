// src/core/security/roles.ts
import { Permission } from './permissions';

export enum Role {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  USER = 'user',
  CONTENT_MANAGER = 'content-manager',
  // Puedes añadir más roles según sea necesario
}

// Mapeo de roles a permisos
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.SYSTEM_ADMIN,
    // Esto implícitamente concede todos los demás permisos
  ],
  
  [Role.DEVELOPER]: [
    Permission.MEDIA_READ,
    Permission.MEDIA_WRITE,
    Permission.LIBRARY_READ,
    Permission.LIBRARY_WRITE,
    Permission.USER_READ,
    // ... otros permisos relevantes
  ],
  
  [Role.USER]: [
    Permission.PRUEBA_READ,
    // Permission.LIBRARY_READ,
    // Permisos básicos de usuario
  ],
  
  [Role.CONTENT_MANAGER]: [
    Permission.MEDIA_READ,
    Permission.MEDIA_WRITE,
    Permission.MEDIA_DELETE,
    Permission.LIBRARY_READ,
    Permission.LIBRARY_WRITE,
    Permission.PRUEBA_READ,
    Permission.PRUEBA_WRITE,    
    Permission.PRUEBA_DELETE,
    // Permisos relacionados con contenido
  ],
};