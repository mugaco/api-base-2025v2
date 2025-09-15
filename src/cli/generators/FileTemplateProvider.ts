/**
 * Proveedor de plantillas basado en archivos
 */
import * as path from 'path';
import { TemplateProvider } from '../interfaces/GeneratorInterface';
import { FileSystemService } from '../interfaces/IOInterface';

/**
 * Implementación de proveedor de plantillas basado en archivos
 */
export class FileTemplateProvider implements TemplateProvider {
  /**
   * Caché de plantillas
   */
  private templateCache: Map<string, string> = new Map();

  /**
   * Constructor de la clase
   * @param fileSystem Servicio de sistema de archivos
   * @param templateDir Directorio base de plantillas
   * @param useCache Indica si se debe utilizar caché
   */
  constructor(
    private readonly fileSystem: FileSystemService,
    private readonly templateDir: string,
    private readonly useCache: boolean = true
  ) {}

  /**
   * Obtiene el contenido de una plantilla
   * @param templateName Nombre de la plantilla
   */
  public async getTemplate(templateName: string): Promise<string> {
    // Si está en caché y se usa caché, devolver desde caché
    if (this.useCache && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Construir la ruta completa a la plantilla
      const templatePath = this.getTemplatePath(templateName);
      
      // Verificar si existe la plantilla
      const exists = await this.fileSystem.fileExists(templatePath);
      
      if (!exists) {
        throw new Error(`La plantilla '${templateName}' no existe en la ruta '${templatePath}'`);
      }
      
      // Leer el contenido de la plantilla
      const content = await this.fileSystem.readFile(templatePath);
      
      // Guardar en caché si está habilitado
      if (this.useCache) {
        this.templateCache.set(templateName, content);
      }
      
      return content;
    } catch (error) {
      throw new Error(`Error al obtener la plantilla '${templateName}': ${(error as Error).message}`);
    }
  }

  /**
   * Verifica si una plantilla existe
   * @param templateName Nombre de la plantilla
   */
  public async hasTemplate(templateName: string): Promise<boolean> {
    // Si está en caché, existe
    if (this.useCache && this.templateCache.has(templateName)) {
      return true;
    }

    try {
      // Construir la ruta completa a la plantilla
      const templatePath = this.getTemplatePath(templateName);
      
      // Verificar si existe la plantilla
      return await this.fileSystem.fileExists(templatePath);
    } catch {
      return false;
    }
  }

  /**
   * Lista todas las plantillas disponibles
   */
  public async listTemplates(): Promise<string[]> {
    try {
      // Listar archivos en el directorio de plantillas
      const files = await this.fileSystem.listFiles(this.templateDir);
      
      // Convertir rutas a nombres de plantillas
      return files.map(file => this.toTemplateName(file));
    } catch (error) {
      throw new Error(`Error al listar plantillas: ${(error as Error).message}`);
    }
  }

  /**
   * Limpia la caché de plantillas
   */
  public clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Obtiene la ruta completa a una plantilla
   * @param templateName Nombre de la plantilla
   */
  private getTemplatePath(templateName: string): string {
    // Si ya tiene extensión, no agregar otra
    if (templateName.includes('.')) {
      return path.join(this.templateDir, templateName);
    }
    
    // Por defecto, agregar extensión .hbs (Handlebars)
    return path.join(this.templateDir, `${templateName}.hbs`);
  }

  /**
   * Convierte una ruta de archivo a nombre de plantilla
   * @param filePath Ruta del archivo
   */
  private toTemplateName(filePath: string): string {
    // Obtener el nombre base del archivo
    const baseName = path.basename(filePath);
    
    // Si tiene extensión .hbs, quitarla
    if (baseName.endsWith('.hbs')) {
      return baseName.slice(0, -4);
    }
    
    return baseName;
  }
} 