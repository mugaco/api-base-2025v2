/**
 * Utilidades para trabajar con archivos y directorios
 */
import fs from 'fs';
import path from 'path';

export class FileUtils {
  /**
   * Verifica si un archivo existe
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Crea un directorio si no existe
   */
  static ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  /**
   * Lee un archivo
   */
  static readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Error al leer el archivo ${filePath}: ${error}`);
    }
  }

  /**
   * Escribe un archivo
   */
  static writeFile(filePath: string, content: string): void {
    try {
      const dir = path.dirname(filePath);
      this.ensureDirectoryExists(dir);
      fs.writeFileSync(filePath, content);
    } catch (error) {
      throw new Error(`Error al escribir el archivo ${filePath}: ${error}`);
    }
  }

  /**
   * Lee un archivo JSON
   */
  static readJsonFile<T>(filePath: string): T {
    try {
      const content = this.readFile(filePath);
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Error al leer el archivo JSON ${filePath}: ${error}`);
    }
  }

  /**
   * Escribe un archivo JSON
   */
  static writeJsonFile(filePath: string, data: any): void {
    try {
      const content = JSON.stringify(data, null, 2);
      this.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Error al escribir el archivo JSON ${filePath}: ${error}`);
    }
  }

  /**
   * Lista archivos en un directorio que coinciden con un patrón
   */
  static listFilesMatching(directoryPath: string, pattern: RegExp): string[] {
    try {
      const files = fs.readdirSync(directoryPath);
      return files.filter(file => pattern.test(file)).map(file => path.join(directoryPath, file));
    } catch (error) {
      throw new Error(`Error al listar archivos en ${directoryPath}: ${error}`);
    }
  }

  /**
   * Obtiene las rutas relativas y absolutas para el proyecto
   */
  static getProjectPaths(): { 
    rootDir: string; 
    srcDir: string; 
    resourcesDir: string; 
    templatesDir: string;
    schemasDir: string;
    fixturesDir: string;
  } {
    const rootDir = process.cwd();
    const srcDir = path.join(rootDir, 'src');
    const resourcesDir = path.join(srcDir, 'api', 'domain', 'entities');
    const templatesDir = path.join(srcDir, 'cli', 'templates');
    const schemasDir = path.join(rootDir, 'schemas');
    const fixturesDir = path.join(rootDir, 'fixtures');
    
    // Asegurar que los directorios existan
    this.ensureDirectoryExists(resourcesDir);
    this.ensureDirectoryExists(templatesDir);
    this.ensureDirectoryExists(schemasDir);
    this.ensureDirectoryExists(fixturesDir);
    
    return { rootDir, srcDir, resourcesDir, templatesDir, schemasDir, fixturesDir };
  }
} 