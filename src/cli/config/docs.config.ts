/**
 * Configuración para el generador de documentación
 */
import * as path from 'path';
import dotenv from 'dotenv';
import { FileUtils } from '../utils/FileUtils';

// Cargar variables de entorno
dotenv.config();

/**
 * Rutas donde buscar recursos para la documentación
 */
export interface DocsConfig {
  /**
   * Directorios donde buscar recursos
   */
  resourceDirectories: string[];
  
  /**
   * Título de la API para la documentación
   */
  apiTitle: string;
  
  /**
   * Versión de la API
   */
  apiVersion: string;
  
  /**
   * Descripción de la API
   */
  apiDescription?: string;
}

/**
 * Configuración por defecto para la documentación
 */
export const defaultDocsConfig: DocsConfig = {
  resourceDirectories: [
    path.join('src', 'api', 'domain', 'entities'),
    path.join('src', 'core', 'entities')
  ],
  apiTitle: process.env.API_TITLE || 'API Base 2025',
  apiVersion: process.env.API_VERSION || '1.0.0',
  apiDescription: process.env.API_DESCRIPTION || 'API para la gestión de contenidos y recursos'
};

/**
 * Obtiene la configuración de documentación
 */
export function getDocsConfig(): DocsConfig {
  try {
    const { rootDir } = FileUtils.getProjectPaths();
    const configPath = path.join(rootDir, 'docs.config.json');
    
    // Intentar cargar configuración personalizada
    if (FileUtils.fileExists(configPath)) {
      const customConfig = FileUtils.readJsonFile<Partial<DocsConfig>>(configPath);
      return {
        ...defaultDocsConfig,
        ...customConfig,
      };
    }
    
    return defaultDocsConfig;
  } catch {
    return defaultDocsConfig;
  }
} 