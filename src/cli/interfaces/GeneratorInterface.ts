/**
 * Interfaces para generadores de código y plantillas
 */

/**
 * Interfaz para generadores de código
 */
export interface Generator<T = Record<string, unknown>> {
  /**
   * Genera código a partir de una plantilla y datos
   */
  generate(templateName: string, data: T): Promise<string>;

  /**
   * Genera un archivo a partir de una plantilla y datos
   */
  generateFile(templateName: string, data: T, outputPath: string): Promise<void>;

  /**
   * Verifica si el generador puede manejar un tipo de plantilla
   */
  canHandle(templateName: string): boolean;
}

/**
 * Proveedor de plantillas
 */
export interface TemplateProvider {
  /**
   * Obtiene el contenido de una plantilla
   */
  getTemplate(templateName: string): Promise<string>;

  /**
   * Verifica si una plantilla existe
   */
  hasTemplate(templateName: string): Promise<boolean>;

  /**
   * Lista todas las plantillas disponibles
   */
  listTemplates(): Promise<string[]>;
}

/**
 * Opciones para la generación de archivos
 */
export interface GenerationOptions<T = unknown> {
  /**
   * Sobrescribir archivos existentes
   */
  overwrite?: boolean;

  /**
   * Ruta base para la generación de archivos
   */
  basePath?: string;

  /**
   * Función de transformación para el contenido generado
   */
  transform?: (content: string, data: T) => string;

  /**
   * Datos adicionales para la generación
   */
  [key: string]: unknown;
} 