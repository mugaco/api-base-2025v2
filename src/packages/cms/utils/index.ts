/**
 * Sistema de Aplanación de Traducciones CMS
 * 
 * Exporta todas las clases, tipos y utilidades para trabajar
 * con entidades CMS multiidioma aplanadas.
 * 
 * @example
 * ```typescript
 * import { PublicationFlattener, CMSTranslationFlattener } from '@packages/cms/utils';
 * 
 * // Uso directo con type safety
 * const flatPublication = PublicationFlattener.flatten(publication, 'es-ES');
 * 
 * // Uso genérico
 * const flatEntity = CMSTranslationFlattener.flatten(entity, 'publication', 'en-US');
 * ```
 */

// Clase principal genérica
export { 
  CMSTranslationFlattener,
  type CMSEntityConfig,
  type BaseTranslation,
  type BaseCMSEntity 
} from './CMSTranslationFlattener';

// Clases específicas por entidad
export { PublicationFlattener } from './flatteners/PublicationFlattener';
export { CategoryFlattener } from './flatteners/CategoryFlattener';
export { TagFlattener } from './flatteners/TagFlattener';
export { MenuFlattener } from './flatteners/MenuFlattener';

// Tipos para entidades aplanadas
export {
  type FlattenedPublication,
  type FlattenedCategory,
  type FlattenedTag,
  type FlattenedMenu,
  type FlattenedCMSEntity,
  type FlattenedPaginatedResponse,
  type FlatteningOptions,
  type FlattenedWithMetadata
} from './types/FlattenedTypes';

// Importar para uso interno
import { CMSTranslationFlattener } from './CMSTranslationFlattener';
import { PublicationFlattener } from './flatteners/PublicationFlattener';
import { CategoryFlattener } from './flatteners/CategoryFlattener';
import { TagFlattener } from './flatteners/TagFlattener';
import { MenuFlattener } from './flatteners/MenuFlattener';

// Importar configuración centralizada del CMS
import {
  CMS_SUPPORTED_LOCALES,
  CMS_DEFAULT_LOCALE,
  CMS_ENTITY_TYPES,
  CMS_SUPPORTED_PUBLICATION_TYPES,
  CMS_DEFAULT_PUBLICATION_TYPE,
  isSupportedLocale as configIsSupportedLocale,
  normalizeLocale as configNormalizeLocale
} from '@packages/cms/config/cms.config';

/**
 * Utilidades de conveniencia
 */

/**
 * Auto-detecta el tipo de entidad y la aplana
 * 
 * @param entity - Entidad CMS cualquiera
 * @param locale - Idioma deseado
 * @returns Entidad aplanada o la misma si no se puede detectar
 */
export function autoFlatten(entity: Record<string, unknown>, locale?: string): Record<string, unknown> {
  const entityType = CMSTranslationFlattener.detectEntityType(entity as never);
  if (!entityType) {
    return entity;
  }

  return CMSTranslationFlattener.flatten(entity as never, entityType as 'publication' | 'category' | 'tag' | 'menu', locale);
}

/**
 * Auto-detecta y aplana un array de entidades mixtas
 * 
 * @param entities - Array de entidades CMS
 * @param locale - Idioma deseado
 * @returns Array de entidades aplanadas
 */
export function autoFlattenArray(entities: Array<Record<string, unknown>>, locale?: string): Array<Record<string, unknown>> {
  return entities.map(entity => autoFlatten(entity, locale));
}

/**
 * Mapa de flatteners específicos por tipo de entidad
 */
export const ENTITY_FLATTENERS = {
  publication: PublicationFlattener,
  category: CategoryFlattener,
  tag: TagFlattener,
  menu: MenuFlattener
} as const;

/**
 * Obtiene el flattener específico para un tipo de entidad
 * 
 * @param entityType - Tipo de entidad
 * @returns Clase flattener específica
 */
export function getFlattenerForEntity(entityType: keyof typeof ENTITY_FLATTENERS): typeof ENTITY_FLATTENERS[keyof typeof ENTITY_FLATTENERS] {
  return ENTITY_FLATTENERS[entityType];
}

/**
 * Constantes útiles (importadas desde configuración centralizada)
 */
export { 
  CMS_SUPPORTED_LOCALES, 
  CMS_DEFAULT_LOCALE, 
  CMS_ENTITY_TYPES,
  CMS_SUPPORTED_PUBLICATION_TYPES,
  CMS_DEFAULT_PUBLICATION_TYPE
};

/**
 * Validador de idiomas soportados
 * 
 * @param locale - Idioma a validar
 * @returns true si el idioma está soportado
 */
export function isSupportedLocale(locale: string): boolean {
  return configIsSupportedLocale(locale);
}

/**
 * Normalizador de códigos de idioma
 * 
 * @param locale - Idioma en cualquier formato
 * @returns Idioma normalizado o null si no es válido
 */
export function normalizeLocale(locale: string): string | null {
  return configNormalizeLocale(locale);
}

/**
 * Extractor de idioma preferido con fallbacks inteligentes
 * 
 * @param req - Request de Express
 * @returns Idioma normalizado y válido
 */
export function extractAndNormalizeLocale(req: Record<string, unknown>): string {
  const rawLocale = CMSTranslationFlattener.extractLocaleFromRequest(req as never);

  if (rawLocale) {
    const normalized = normalizeLocale(rawLocale);
    if (normalized) {
      return normalized;
    }
  }

  return CMS_DEFAULT_LOCALE;
}

/**
 * Middleware helper para añadir funciones de flattening al request
 * 
 * @param req - Request object
 */
export function enhanceRequestWithFlattening(req: Record<string, unknown>): void {
  const locale = extractAndNormalizeLocale(req);

  (req as Record<string, unknown> & {
    cmsLocale: string;
    flattenCMS: (entity: Record<string, unknown>) => Record<string, unknown>;
    flattenCMSArray: (entities: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  }).cmsLocale = locale;
  (req as Record<string, unknown> & {
    cmsLocale: string;
    flattenCMS: (entity: Record<string, unknown>) => Record<string, unknown>;
    flattenCMSArray: (entities: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  }).flattenCMS = (entity: Record<string, unknown>): Record<string, unknown> => autoFlatten(entity, locale);
  (req as Record<string, unknown> & {
    cmsLocale: string;
    flattenCMS: (entity: Record<string, unknown>) => Record<string, unknown>;
    flattenCMSArray: (entities: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  }).flattenCMSArray = (entities: Array<Record<string, unknown>>): Array<Record<string, unknown>> => autoFlattenArray(entities, locale);
} 