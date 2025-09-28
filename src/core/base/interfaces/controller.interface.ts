import { Request, Response, NextFunction } from 'express';

/**
 * Interfaz base para todos los controladores
 * Define los métodos estándar que debe implementar un controlador CRUD
 */
export interface IController {
  /**
   * Método unificado que maneja todas las consultas GET
   * - Sin 'page': devuelve todos con límite de seguridad
   * - Con 'page': aplica paginación
   * - Soporta simpleSearch y filters automáticamente
   */
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Obtiene un recurso por su ID
   */
  findById: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Crea un nuevo recurso
   */
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Actualiza un recurso existente
   */
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Elimina un recurso permanentemente
   */
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Elimina un recurso de forma lógica (opcional)
   */
  softDelete?: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Restaura un recurso eliminado lógicamente (opcional)
   */
  restore?: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}