/**
 * Interfaces para definir recursos analizados
 */
import { RouteDefinition } from '../utils/RouterAnalyzer';
import { ModelDefinition } from '../utils/ModelAnalyzer';
import { DtoDefinition } from '../utils/DtoAnalyzer';

/**
 * Representa un recurso completo analizado desde el código
 */
export interface ResourceDefinition {
  /**
   * Nombre del recurso (corresponde al nombre de la carpeta)
   */
  name: string;

  /**
   * Rutas definidas para el recurso
   */
  routes: RouteDefinition[];

  /**
   * Definición del modelo
   */
  model: ModelDefinition;

  /**
   * Definiciones de DTOs
   */
  dtos?: DtoDefinition[];

  /**
   * Ruta base de API para este recurso
   */
  apiBasePath?: string;
} 