/**
 * Registro de dependencias de middleware y servicios de autenticación/autorización
 * Incluye middleware de autenticación, validación, rate limiting, etc.
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

/**
 * Registra middleware y servicios relacionados con la seguridad y validación
 */
export function registerMiddlewareDependencies(_container: AwilixContainer): void {

  // ========================================
  // Servicios de Autenticación
  // ========================================
  // Container.register('authService').asClass(AuthService).scoped();
  // Container.register('tokenService').asClass(TokenService).singleton();
  // Container.register('sessionService').asClass(SessionService).scoped();

  // ========================================
  // Middleware de Autenticación
  // ========================================
  // Container.register('authMiddleware').asFunction(createAuthMiddleware).singleton();
  // Container.register('jwtMiddleware').asFunction(createJwtMiddleware).singleton();
  // Container.register('apiKeyMiddleware').asFunction(createApiKeyMiddleware).singleton();

  // ========================================
  // Middleware de Validación
  // ========================================
  // Container.register('validationMiddleware').asFunction(createValidationMiddleware).singleton();
  // Container.register('sanitizationMiddleware').asFunction(createSanitizationMiddleware).singleton();

  // ========================================
  // Middleware de Seguridad
  // ========================================
  // Container.register('rateLimiter').asFunction(createRateLimiter).singleton();
  // Container.register('corsMiddleware').asFunction(createCorsMiddleware).singleton();
  // Container.register('helmetMiddleware').asFunction(createHelmetMiddleware).singleton();

  // ========================================
  // Middleware de Monitoreo
  // ========================================
  // Container.register('requestLogger').asFunction(createRequestLogger).singleton();
  // Container.register('performanceMonitor').asFunction(createPerformanceMonitor).singleton();
  // Container.register('errorTracker').asFunction(createErrorTracker).singleton();

  // ========================================
  // Servicios de Autorización
  // ========================================
  // Container.register('permissionService').asClass(PermissionService).scoped();
  // Container.register('roleService').asClass(RoleService).scoped();
  // Container.register('aclService').asClass(AclService).singleton();

  // Placeholder para evitar advertencias de función vacía
  if (Container) {
    // Los servicios se registrarán aquí cuando se implementen
  }
}