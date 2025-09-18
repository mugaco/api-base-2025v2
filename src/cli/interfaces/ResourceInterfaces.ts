/**
 * Interfaces para definir recursos analizados
 */

/**
 * Definición básica de ruta
 */
export interface RouteDefinition {
  method: string;
  path: string;
  handler?: string;
  middlewares?: string[];
}

/**
 * Definición básica de modelo
 */
export interface ModelDefinition {
  name: string;
  fields: Record<string, unknown>;
  methods?: string[];
}

/**
 * Definición básica de DTO
 */
export interface DtoDefinition {
  name: string;
  fields: Record<string, unknown>;
}

/**
 * Representa un recurso completo analizado desde el código
 */
export interface ResourceDefinition {
  /**
   * Nombre del recurso (corresponde al nombre de la carpeta)
   */
  name: string;

  /**
   * Rutas definidas para el recurso
   */
  routes: RouteDefinition[];

  /**
   * Definición del modelo
   */
  model: ModelDefinition;

  /**
   * Definiciones de DTOs
   */
  dtos?: DtoDefinition[];

  /**
   * Ruta base de API para este recurso
   */
  apiBasePath?: string;
} 