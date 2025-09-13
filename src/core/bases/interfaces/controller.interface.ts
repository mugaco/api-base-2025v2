import { Request, Response, NextFunction } from 'express';

/**
 * Interfaz base para todos los controladores
 * Define los métodos estándar que debe implementar un controlador CRUD
 */
export interface IController {
  /**
   * Obtiene todos los recursos
   */
  getAll?: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Método unificado que maneja tanto solicitudes getAll como getPaginated
   * basado en la presencia del parámetro 'page'
   */
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Obtiene un recurso por su ID
   */
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;

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
   * Elimina un recurso de forma lógica
   */
  softDelete?: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Restaura un recurso eliminado lógicamente
   */
  restore?: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * Obtiene recursos de forma paginada
   */
  getPaginated?: (req: Request, res: Response, next: NextFunction) => Promise<void>;

}