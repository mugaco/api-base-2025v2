/**
 * Clase base para generadores de código
 */
import path from 'path';
import { Generator, GenerationOptions } from '../interfaces/GeneratorInterface';
import { TemplateProvider } from '../interfaces/GeneratorInterface';
import { FileSystemService } from '../interfaces/IOInterface';
import { ConsoleService } from '../interfaces/IOInterface';

/**
 * Clase base abstracta para generadores de código
 */
export abstract class BaseGenerator<T = Record<string, unknown>> implements Generator<T> {
  /**
   * Constructor de la clase
   * @param templateProvider Proveedor de plantillas
   * @param fileSystem Servicio de sistema de archivos
   * @param console Servicio de consola
   */
  constructor(
    protected readonly templateProvider: TemplateProvider,
    protected readonly fileSystem: FileSystemService,
    protected readonly console: ConsoleService
  ) {}

  /**
   * Genera código a partir de una plantilla y datos
   * @param templateName Nombre de la plantilla
   * @param data Datos para la plantilla
   */
  public async generate(templateName: string, data: T): Promise<string> {
    try {
      // Verificar si existe la plantilla
      const exists = await this.templateProvider.hasTemplate(templateName);
      
      if (!exists) {
        throw new Error(`La plantilla '${templateName}' no existe`);
      }
      
      // Obtener la plantilla
      const template = await this.templateProvider.getTemplate(templateName);
      
      // Compilar la plantilla con los datos
      return this.compile(template, data);
    } catch (error) {
      throw new Error(`Error al generar código desde plantilla '${templateName}': ${(error as Error).message}`);
    }
  }

  /**
   * Genera un archivo a partir de una plantilla y datos
   * @param templateName Nombre de la plantilla
   * @param data Datos para la plantilla
   * @param outputPath Ruta de salida
   * @param options Opciones de generación
   */
  public async generateFile(
    templateName: string, 
    data: T, 
    outputPath: string,
    options?: GenerationOptions
  ): Promise<void> {
    try {
      // Verificar si el archivo ya existe
      const fileExists = await this.fileSystem.fileExists(outputPath);
      
      if (fileExists && options?.overwrite === false) {
        this.console.warn(`Omitiendo generación de '${outputPath}': el archivo ya existe y la opción de sobrescritura está desactivada`);
        return;
      }
      
      // Generar el contenido
      let content = await this.generate(templateName, data);
      
      // Aplicar transformación si se especificó
      if (options?.transform) {
        content = options.transform(content, data);
      }
      
      // Asegurarnos que el directorio destino exista
      const dir = path.dirname(outputPath);
      await this.fileSystem.mkdir(dir);
      
      // Escribir el archivo
      await this.fileSystem.writeFile(outputPath, content, { overwrite: true });
      
      this.console.success(`Archivo generado: ${outputPath}`);
    } catch (error) {
      throw new Error(`Error al generar archivo '${outputPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Verifica si el generador puede manejar un tipo de plantilla
   * @param templateName Nombre de la plantilla
   */
  public abstract canHandle(templateName: string): boolean;

  /**
   * Compila una plantilla con los datos proporcionados
   * @param template Contenido de la plantilla
   * @param data Datos para la compilación
   */
  protected abstract compile(template: string, data: T): string;
} 