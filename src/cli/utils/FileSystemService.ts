/**
 * Servicio para operaciones con el sistema de archivos
 */
import * as fs from 'fs';
import * as path from 'path';
import { FileSystemService } from '../interfaces/IOInterface';

/**
 * Implementación del servicio de sistema de archivos
 */
export class DefaultFileSystemService implements FileSystemService {
  /**
   * Lee un archivo
   * @param path Ruta del archivo
   * @param encoding Codificación del archivo
   */
  public async readFile(filePath: string, encoding: string = 'utf8'): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, { encoding: encoding as BufferEncoding });
    } catch (error) {
      throw new Error(`Error al leer el archivo '${filePath}': ${(error as Error).message}`);
    }
  }

  /**
   * Escribe un archivo
   * @param path Ruta del archivo
   * @param content Contenido del archivo
   * @param options Opciones adicionales
   */
  public async writeFile(filePath: string, content: string, options?: { overwrite?: boolean }): Promise<void> {
    try {
      // Verificar si el archivo existe y si debemos sobrescribirlo
      const fileExists = await this.fileExists(filePath);
      
      if (fileExists && options?.overwrite === false) {
        throw new Error(`El archivo '${filePath}' ya existe y la opción de sobrescritura está desactivada`);
      }
      
      // Asegurarse de que el directorio exista
      const dirPath = path.dirname(filePath);
      await this.mkdir(dirPath);
      
      // Escribir el archivo
      await fs.promises.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Error al escribir el archivo '${filePath}': ${(error as Error).message}`);
    }
  }

  /**
   * Verifica si un archivo existe
   * @param path Ruta del archivo
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lee un archivo JSON
   * @param path Ruta del archivo
   */
  public async readJsonFile<T = any>(filePath: string): Promise<T> {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Error al leer el archivo JSON '${filePath}': ${(error as Error).message}`);
    }
  }

  /**
   * Escribe un archivo JSON
   * @param path Ruta del archivo
   * @param data Datos a escribir
   * @param options Opciones adicionales
   */
  public async writeJsonFile<T = any>(
    filePath: string, 
    data: T, 
    options?: { spaces?: number; overwrite?: boolean }
  ): Promise<void> {
    try {
      const content = JSON.stringify(data, null, options?.spaces || 2);
      await this.writeFile(filePath, content, { overwrite: options?.overwrite });
    } catch (error) {
      throw new Error(`Error al escribir el archivo JSON '${filePath}': ${(error as Error).message}`);
    }
  }

  /**
   * Crea un directorio (y sus padres si no existen)
   * @param path Ruta del directorio
   */
  public async mkdir(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Error al crear el directorio '${dirPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Lista archivos en un directorio
   * @param path Ruta del directorio
   * @param pattern Patrón de coincidencia
   */
  public async listFiles(dirPath: string, pattern?: RegExp): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      // Filtrar solo archivos
      let files = entries
        .filter(entry => entry.isFile())
        .map(entry => path.join(dirPath, entry.name));
      
      // Aplicar patrón si se especificó
      if (pattern) {
        files = files.filter(file => pattern.test(file));
      }
      
      return files;
    } catch (error) {
      throw new Error(`Error al listar archivos en '${dirPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Lista directorios en un directorio
   * @param path Ruta del directorio
   */
  public async listDirs(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      // Filtrar solo directorios
      const dirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(dirPath, entry.name));
      
      return dirs;
    } catch (error) {
      throw new Error(`Error al listar directorios en '${dirPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Copia un archivo
   * @param source Ruta del archivo fuente
   * @param destination Ruta del archivo destino
   * @param options Opciones adicionales
   */
  public async copyFile(
    source: string, 
    destination: string, 
    options?: { overwrite?: boolean }
  ): Promise<void> {
    try {
      // Verificar si el archivo destino existe y si debemos sobrescribirlo
      const fileExists = await this.fileExists(destination);
      
      if (fileExists && options?.overwrite === false) {
        throw new Error(`El archivo destino '${destination}' ya existe y la opción de sobrescritura está desactivada`);
      }
      
      // Asegurarse de que el directorio destino exista
      const dirPath = path.dirname(destination);
      await this.mkdir(dirPath);
      
      // Copiar el archivo
      await fs.promises.copyFile(source, destination);
    } catch (error) {
      throw new Error(`Error al copiar el archivo de '${source}' a '${destination}': ${(error as Error).message}`);
    }
  }

  /**
   * Elimina un archivo
   * @param path Ruta del archivo
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      throw new Error(`Error al eliminar el archivo '${filePath}': ${(error as Error).message}`);
    }
  }

  /**
   * Elimina un directorio
   * @param path Ruta del directorio
   * @param options Opciones adicionales
   */
  public async deleteDir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await fs.promises.rm(dirPath, { recursive: options?.recursive || false, force: true });
    } catch (error) {
      throw new Error(`Error al eliminar el directorio '${dirPath}': ${(error as Error).message}`);
    }
  }

  /**
   * Verifica si una ruta es un directorio
   * @param path Ruta a verificar
   */
  public async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Asegura que un directorio existe, creándolo si es necesario
   * @param path Ruta del directorio
   */
  public async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignorar error si el directorio ya existe
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Une segmentos de ruta
   * @param paths Segmentos de ruta a unir
   */
  public joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }
} 