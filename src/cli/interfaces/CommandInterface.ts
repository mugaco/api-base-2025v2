/**
 * Interfaces para los comandos del CLI
 */

/**
 * Opciones generales para los comandos
 */
export interface CommandOptions {
  [key: string]: unknown;
}

/**
 * Interfaz para los comandos del CLI
 */
export interface Command {
  /**
   * Nombre del comando
   */
  getName(): string;

  /**
   * Descripción del comando
   */
  getDescription(): string;

  /**
   * Opciones disponibles para el comando
   */
  getOptions(): CommandOption[];

  /**
   * Ejecuta el comando con las opciones especificadas
   */
  execute(options: CommandOptions): Promise<void>;
}

/**
 * Interfaz para una opción de comando
 */
export interface CommandOption {
  /**
   * Nombre largo de la opción (--option)
   */
  name: string;

  /**
   * Alias corto de la opción (-o)
   */
  alias?: string;

  /**
   * Descripción de la opción
   */
  description: string;

  /**
   * Tipo de la opción
   */
  type?: 'boolean' | 'string' | 'number' | 'array';

  /**
   * Valor por defecto
   */
  default?: string | boolean | string[];

  /**
   * Indica si la opción es requerida
   */
  required?: boolean;
} 