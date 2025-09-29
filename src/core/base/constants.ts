/**
 * Constantes de configuración para el sistema base
 */

/**
 * Límites de paginación para proteger contra consultas excesivas
 */
export const PAGINATION_LIMITS = {
  /** Número de elementos por página por defecto */
  DEFAULT: 10,

  /** Máximo número de elementos permitidos por página */
  MAX: 100,

  /** Límite de seguridad cuando no se especifica paginación */
  SAFETY: 100
} as const;

/**
 * Configuración de filtros permanentes
 */
export const PERMANENT_FILTERS = {
  /** Filtro para excluir elementos eliminados lógicamente */
  EXCLUDE_DELETED: { isDeleted: false }
} as const;