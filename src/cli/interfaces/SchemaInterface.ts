/**
 * Interfaces para la definición de esquemas de datos
 */

/**
 * Tipos básicos soportados
 */
export type DataType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'date'
  | 'enum'
  | 'reference'
  | 'objectid'  // Para referencias a otros modelos
  | 'schema'    // Para subdocumentos
  | 'nested';

/**
 * Interface para las restricciones de validación
 */
export interface ValidationConstraint {
  /**
   * Tipo de validación
   */
  type: string;

  /**
   * Valor de la validación
   */
  value: any;

  /**
   * Mensaje de error personalizado
   */
  message?: string;
}

/**
 * Interface para un campo de un esquema
 */
export interface SchemaField {
  /**
   * Nombre del campo
   */
  name: string;

  /**
   * Tipo de dato del campo
   */
  type: DataType;

  /**
   * Indica si el campo es requerido
   */
  required?: boolean;

  /**
   * Descripción del campo
   */
  description?: string;

  /**
   * Valor por defecto
   */
  default?: any;

  /**
   * Valores permitidos (para tipo enum)
   */
  enum?: any[];

  /**
   * Referencia a otro esquema (para tipo reference u objectid)
   */
  reference?: string;

  /**
   * Referencia a otro esquema (para tipo objectid)
   */
  ref?: string;

  /**
   * Referencia a un esquema para subdocumentos (para tipo schema)
   */
  schemaRef?: string;

  /**
   * Campos anidados (para tipo nested u object)
   */
  fields?: SchemaField[];

  /**
   * Tipo de los elementos (para arrays)
   */
  items?: SchemaField | { type: DataType, [key: string]: any };

  /**
   * Restricciones de validación
   */
  validations?: ValidationConstraint[];

  /**
   * Metadatos adicionales
   */
  meta?: Record<string, any>;

  /**
   * Propiedades extendidas específicas de cada implementación
   */
  [key: string]: any;
}

/**
 * Interface para un esquema completo
 */
export interface Schema {
  /**
   * Nombre del esquema
   */
  name: string;

  /**
   * Versión del esquema
   */
  version?: string;

  /**
   * Descripción del esquema
   */
  description?: string;

  /**
   * Campos del esquema
   */
  fields: SchemaField[];

  /**
   * Indica si el esquema debe incluir campos de auditoría (createdAt, updatedAt)
   */
  audit?: boolean;

  /**
   * Indica si el esquema debe implementar borrado lógico
   */
  softDelete?: boolean;

  /**
   * Opciones para el API REST
   */
  api?: {
    /**
     * Ruta base para el API
     */
    path?: string;

    /**
     * Opciones de autenticación
     */
    auth?: boolean | Record<string, any>;

    /**
     * Endpoints personalizados
     */
    endpoints?: Record<string, any>;
  };

  /**
   * Relaciones con otros esquemas
   */
  relations?: Array<{
    /**
     * Tipo de relación
     */
    type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';

    /**
     * Nombre del esquema relacionado
     */
    schema: string;

    /**
     * Campo local que representa la relación
     */
    localField?: string;

    /**
     * Campo remoto que representa la relación
     */
    foreignField?: string;

    /**
     * Opciones adicionales para la relación
     */
    options?: Record<string, any>;
  }>;

  /**
   * Metadatos adicionales
   */
  meta?: Record<string, any>;

  /**
   * Propiedades extendidas específicas de cada implementación
   */
  [key: string]: any;
} 