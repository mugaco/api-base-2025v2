/**
 * Interfaces para la definición de recursos en el CLI
 */

export type JavaScriptType = 'string' | 'email' | 'number' | 'integer' | 'boolean' | 'date' | 'array' | 'object' | 'objectid' | 'schema';
export type MongooseType = 'String' | 'Number' | 'Boolean' | 'Date' | 'Array' | 'Object' | 'Schema.Types.ObjectId' | 'Schema.Types.Mixed';

export interface Validation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface Field {
  name: string;
  required: boolean;
  type: JavaScriptType;
  min?: number;
  max?: number;
  enum?: string[];
  default?: string | number | boolean | Date | string[];
  ref?: string; // Referencia a otro modelo (relación)
  schemaRef?: string; // Referencia a un esquema para tipo 'schema'
  unique?: boolean;
  validation?: Validation;
  description?: string;
  items?: string | Field | FieldDefinition; // Para arrays, define el tipo de elementos
  properties?: Record<string, Field | FieldDefinition>; // Para objetos, define las propiedades
  example?: string | number | boolean | Date | string[] | Record<string, unknown>; // Ejemplo para la documentación
  format?: string; // Formato específico (date-time, email, etc.)
  pattern?: string; // Patrón de validación (regex)
}

// Alias para compatibilidad con OpenAPI
export type FieldDefinition = Field;

export interface Relation {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
  resource: string;
  foreignKey?: string;
  localKey?: string;
}

export interface RouteMiddlewareConfig {
  middlewares: string[];
  description?: string;
}

export interface RoutesMiddlewares {
  getAll: RouteMiddlewareConfig;
  findById: RouteMiddlewareConfig;
  create: RouteMiddlewareConfig;
  update: RouteMiddlewareConfig;
  delete: RouteMiddlewareConfig;
  findPaginated: RouteMiddlewareConfig;
  [key: string]: RouteMiddlewareConfig; // Permitir indexación por string
}

export interface DataSource {
  name: string;
  description?: string;
  fields: Field[];
  relations?: Relation[];
  routesMiddlewares: RoutesMiddlewares;
  apiPath?: string; // Ruta base para el API
  timestamps?: boolean; // Si debe incluir createdAt y updatedAt
  softDelete?: boolean; // Si debe implementar borrado lógico
  versioning?: boolean; // Si debe mantener versiones del recurso
}

export interface ResourceOptions {
  overwrite?: boolean;
  generateTests?: boolean;
  updatePostman?: boolean;
}

export interface Templates {
  controller: string;
  service: string;
  repository: string;
  model: string;
  dto: string;
  routes: string;
}

export interface Specs {
  resourceName: string;
  resourceNameLower: string;
  resourceNameUpper: string;
  resourceNamePlural: string;
  resourcePath: string;
  [key: string]: string | boolean | number | unknown; // Permite propiedades adicionales
} 