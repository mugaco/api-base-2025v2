/**
 * Interfaces para servicios de entrada/salida
 */

/**
 * Opciones generales para mensajes en consola
 */
export interface ConsoleOptions {
  /**
   * Color del texto
   */
  color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

  /**
   * Estilo del texto
   */
  style?: 'bold' | 'italic' | 'underline' | 'inverse';

  /**
   * Icono para el mensaje
   */
  icon?: string;
}

/**
 * Interfaz para servicios de consola
 */
export interface ConsoleService {
  /**
   * Muestra un mensaje informativo
   */
  info(message: string, options?: ConsoleOptions): void;

  /**
   * Muestra un mensaje de éxito
   */
  success(message: string, options?: ConsoleOptions): void;

  /**
   * Muestra un mensaje de advertencia
   */
  warn(message: string, options?: ConsoleOptions): void;

  /**
   * Muestra un mensaje de error
   */
  error(message: string, options?: ConsoleOptions): void;

  /**
   * Muestra un mensaje de depuración
   */
  debug(message: string, options?: ConsoleOptions): void;

  /**
   * Muestra un mensaje normal
   */
  log(message: string, options?: ConsoleOptions): void;
}

/**
 * Tipos de preguntas para la entrada interactiva
 */
export type PromptType = 'input' | 'number' | 'confirm' | 'list' | 'checkbox' | 'password' | 'editor';

/**
 * Opciones para una pregunta
 */
export interface PromptOptions {
  /**
   * Mensaje de la pregunta
   */
  message: string;

  /**
   * Tipo de pregunta
   */
  type: PromptType;

  /**
   * Valor por defecto
   */
  default?: string | number | boolean;

  /**
   * Opciones para preguntas de tipo list o checkbox
   */
  choices?: Array<{
    name: string;
    value: string | number | boolean;
    checked?: boolean;
  }>;

  /**
   * Función de validación de la respuesta
   */
  validate?: (input: string) => boolean | string | Promise<boolean | string>;

  /**
   * Función de transformación de la respuesta
   */
  transform?: (input: string | number | boolean) => string | number | boolean;

  /**
   * Indica si la pregunta se debe hacer solo si se cumple una condición
   */
  when?: boolean | ((answers: Record<string, unknown>) => boolean | Promise<boolean>);
}

/**
 * Opciones extendidas para validación de entrada
 */
export interface ExtendedPromptOptions {
  /**
   * Indica si el campo es obligatorio
   */
  required?: boolean;
  
  /**
   * Función de validación personalizada
   */
  validator?: (input: string) => boolean | string | Promise<boolean | string>;
}

/**
 * Interfaz para servicios de entrada interactiva
 */
export interface PromptService {
  /**
   * Solicita un valor de entrada
   */
  prompt<T = string>(options: PromptOptions): Promise<T>;

  /**
   * Solicita múltiples valores de entrada
   */
  promptMany<T = Record<string, unknown>>(questions: Array<PromptOptions & { name: string }>): Promise<T>;

  /**
   * Solicita un valor de entrada de texto
   * @param message Mensaje de la pregunta
   * @param options Opciones adicionales (valor por defecto, validación, etc.)
   */
  promptInput(
    message: string,
    options?: ExtendedPromptOptions & { default?: string }
  ): Promise<string>;

  /**
   * Solicita una confirmación (sí/no)
   * @param message Mensaje de la pregunta
   * @param defaultValue Valor por defecto
   */
  promptConfirm(message: string, defaultValue?: boolean): Promise<boolean>;

  /**
   * Solicita seleccionar un elemento de una lista
   * @param message Mensaje de la pregunta
   * @param choices Opciones disponibles
   * @param defaultValue Valor por defecto
   */
  promptSelect<T extends string | number | boolean = string>(
    message: string,
    choices: Array<{ name: string; value: T; checked?: boolean }>,
    defaultValue?: T
  ): Promise<T>;

  /**
   * Solicita seleccionar múltiples elementos de una lista
   * @param message Mensaje de la pregunta
   * @param choices Opciones disponibles
   */
  promptCheckbox<T = string[]>(
    message: string,
    choices: Array<{ name: string; value: string | number | boolean; checked?: boolean }>
  ): Promise<T>;

  /**
   * Solicita entrada de texto oculto (contraseña)
   * @param message Mensaje de la pregunta
   * @param options Opciones adicionales (validación, etc.)
   */
  promptPassword(message: string, options?: ExtendedPromptOptions): Promise<string>;
}

/**
 * Interfaz para servicios de sistema de archivos
 */
export interface FileSystemService {
  /**
   * Lee un archivo
   */
  readFile(path: string, encoding?: string): Promise<string>;

  /**
   * Escribe un archivo
   */
  writeFile(path: string, content: string, options?: { overwrite?: boolean }): Promise<void>;

  /**
   * Verifica si un archivo existe
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Lee un archivo JSON
   */
  readJsonFile<T = Record<string, unknown>>(path: string): Promise<T>;

  /**
   * Escribe un archivo JSON
   */
  writeJsonFile<T = Record<string, unknown>>(path: string, data: T, options?: { spaces?: number, overwrite?: boolean }): Promise<void>;

  /**
   * Crea un directorio (y sus padres si no existen)
   */
  mkdir(path: string): Promise<void>;

  /**
   * Lista archivos en un directorio
   */
  listFiles(path: string, pattern?: RegExp): Promise<string[]>;

  /**
   * Lista directorios en un directorio
   */
  listDirs(path: string): Promise<string[]>;

  /**
   * Copia un archivo
   */
  copyFile(source: string, destination: string, options?: { overwrite?: boolean }): Promise<void>;

  /**
   * Elimina un archivo
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Elimina un directorio
   */
  deleteDir(path: string, options?: { recursive?: boolean }): Promise<void>;

  /**
   * Verifica si una ruta es un directorio
   * @param path Ruta a verificar
   */
  isDirectory(path: string): Promise<boolean>;

  /**
   * Asegura que un directorio existe, creándolo si es necesario
   * @param path Ruta del directorio
   */
  ensureDirectoryExists(path: string): Promise<void>;

  /**
   * Une segmentos de ruta
   * @param paths Segmentos de ruta a unir
   */
  joinPaths(...paths: string[]): string;
} 