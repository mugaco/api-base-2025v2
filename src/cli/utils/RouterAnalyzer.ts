/**
 * Analizador de archivos de rutas
 * Extrae información de los endpoints definidos en los archivos de rutas
 */
import fs from 'fs';
import path from 'path';
import { FileUtils } from './FileUtils';

export interface RouteDefinition {
  method: string;
  path: string;
  description?: string;
  middlewares?: string[];
  controller?: string;
  isAuthenticated?: boolean;
  parameters?: RouteParameter[];
  responses?: RouteResponse[];
}

export interface RouteParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  location: 'path' | 'query' | 'body' | 'header';
}

export interface RouteResponse {
  statusCode: number;
  description: string;
  contentType?: string;
}

export class RouterAnalyzer {
  /**
   * Analiza un archivo de rutas para extraer definiciones de endpoints
   */
  static async analyze(routeFilePath: string): Promise<RouteDefinition[]> {
    try {
      // Leer el archivo de rutas
      const content = await fs.promises.readFile(routeFilePath, 'utf8');
      
      // Usar análisis de código para detectar definiciones de rutas
      const routes: RouteDefinition[] = [];
      
      // Detectar importaciones de middlewares
      const hasAuthMiddleware = this.detectAuthMiddleware(content);
      
      // Extraer nombre del recurso del nombre del archivo
      const resourceName = path.basename(routeFilePath, '.ts').replace('Routes', '');
      
      // Detectar si hay un bloque router.use(authenticate) para proteger todas las rutas
      const routerUseAuth = /router\.use\s*\(\s*authenticate\s*\)/i.test(content);
      
      // Ejemplo de detección simple de rutas
      const routeRegex = /router\.(get|post|put|delete|patch)\(\s*['"]([^'"]*)['"]/g;
      let match;
      
      while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let routePath = match[2];
        
        // Determinar el contexto de la ruta (extraer código cercano)
        const routeContext = this.extractRouteContext(content, match.index);
        
        // Detectar middleware de validación y extraer DTO usado
        const validationInfo = this.detectValidationMiddleware(routeContext);
        
        // Extraer el controlador usado
        const controller = this.extractController(routeContext);
        
        // Detectar si este endpoint específico está protegido
        const isAuthenticated = routerUseAuth || /authenticate/.test(routeContext);
        
        // Ajustar la ruta para incluir el nombre del recurso
        // Por ejemplo, /api/{resource}/...
        
        // Extraer descripción de los comentarios
        const description = this.extractDescriptionForRoute(content, match.index);
        
        routes.push({
          method,
          path: routePath,
          description: description || `${method} ${resourceName} endpoint`,
          middlewares: validationInfo.middlewares,
          controller,
          isAuthenticated,
          parameters: validationInfo.parameters
        });
      }
      
      return routes;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error analizando rutas en ${routeFilePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Extrae la descripción de una ruta a partir de los comentarios cercanos
   */
  private static extractDescriptionForRoute(content: string, position: number): string {
    // Buscar el comentario más cercano anterior a la posición
    const contentBeforeRoute = content.substring(0, position);
    
    // Buscar comentarios JSDoc o comentarios de línea
    const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//;
    const lineCommentRegex = /\/\/\s*(.*)/;
    
    // Primero intentar encontrar un comentario JSDoc
    const jsdocMatch = contentBeforeRoute.match(new RegExp(jsdocRegex.source + '\\s*$'));
    
    if (jsdocMatch && jsdocMatch[1]) {
      // Limpiar el comentario JSDoc
      return jsdocMatch[1]
        .replace(/\s*\*\s*/g, ' ')
        .trim();
    }
    
    // Si no hay JSDoc, buscar comentario de línea
    const lineCommentMatch = contentBeforeRoute.match(new RegExp(lineCommentRegex.source + '\\s*$'));
    
    if (lineCommentMatch && lineCommentMatch[1]) {
      return lineCommentMatch[1].trim();
    }
    
    return '';
  }
  
  /**
   * Extrae el contexto (código cercano) de una ruta
   */
  private static extractRouteContext(content: string, position: number): string {
    // Extrae el código desde la definición de la ruta hasta el siguiente punto y coma o llave de cierre
    const routeDeclaration = content.substring(position);
    
    // Buscar el final de la declaración de la ruta
    const endOfRouteMatch = /[;)]\s*\n/.exec(routeDeclaration);
    
    if (endOfRouteMatch) {
      return routeDeclaration.substring(0, endOfRouteMatch.index + 1);
    }
    
    // Si no se encuentra un final claro, devolver una porción razonable
    return routeDeclaration.substring(0, 200);
  }
  
  /**
   * Detecta middlewares de validación en el contexto de la ruta
   */
  private static detectValidationMiddleware(routeContext: string): { 
    middlewares: string[], 
    parameters: RouteParameter[] 
  } {
    const middlewares: string[] = [];
    const parameters: RouteParameter[] = [];
    
    // Detectar validateRequest middleware
    const validateRequestRegex = /validateRequest\s*\(\s*(\w+)\s*\)/;
    const match = validateRequestRegex.exec(routeContext);
    
    if (match && match[1]) {
      const dtoName = match[1];
      middlewares.push(`validateRequest(${dtoName})`);
      
      // Agregar parámetro de body basado en el DTO
      parameters.push({
        name: 'body',
        type: dtoName,
        description: `Request body validated against ${dtoName}`,
        required: true,
        location: 'body'
      });
    }
    
    // Detectar parámetros de ruta
    if (routeContext.includes('/:')) {
      const pathParams = (routeContext.match(/\/:([\w-]+)/g) || [])
        .map(param => param.substring(2));
      
      for (const param of pathParams) {
        parameters.push({
          name: param,
          type: 'string',
          description: `Path parameter: ${param}`,
          required: true,
          location: 'path'
        });
      }
    }
    
    return { middlewares, parameters };
  }
  
  /**
   * Extrae el nombre del controlador usado en la ruta
   */
  private static extractController(routeContext: string): string {
    // Buscar el controlador al final de la definición de la ruta
    const controllerRegex = /,\s*(\w+\.\w+)\s*\)?$/;
    const match = controllerRegex.exec(routeContext);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return '';
  }
  
  /**
   * Detecta si se importa el middleware de autenticación
   */
  private static detectAuthMiddleware(content: string): boolean {
    return /import\s+.*?\{\s*.*?authenticate.*?\}\s+from/.test(content);
  }
} 