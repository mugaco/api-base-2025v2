/**
 * Flattener específico para entidades Category
 * 
 * Proporciona métodos type-safe para aplanar categorías
 * con funcionalidades específicas como jerarquías.
 */

import { CMSTranslationFlattener } from '../CMSTranslationFlattener';
import { ICategoryResponse } from '@packages/cms/entities/Category/CategorySchema';
import { FlattenedCategory, FlatteningOptions } from '../types/FlattenedTypes';

export class CategoryFlattener {
  
  /**
   * Aplana una categoría a un idioma específico
   * 
   * @param category - Categoría con traducciones
   * @param locale - Idioma deseado (opcional)
   * @returns Categoría aplanada
   */
  static flatten(
    category: ICategoryResponse,
    locale?: string
  ): FlattenedCategory {
    return CMSTranslationFlattener.flatten(
      category, 
      'category', 
      locale
    ) as unknown as FlattenedCategory;
  }

  /**
   * Aplana un array de categorías
   * 
   * @param categories - Array de categorías
   * @param locale - Idioma deseado (opcional)
   * @returns Array de categorías aplanadas
   */
  static flattenArray(
    categories: ICategoryResponse[],
    locale?: string
  ): FlattenedCategory[] {
    return CMSTranslationFlattener.flattenArray(
      categories, 
      'category', 
      locale
    ) as unknown as FlattenedCategory[];
  }

  /**
   * Construye query de búsqueda específico para categorías
   * 
   * @param searchTerm - Término de búsqueda
   * @param locale - Idioma específico (opcional)
   * @returns Query optimizado para MongoDB
   */
  static buildSearchQuery(searchTerm: string, locale?: string): Record<string, unknown> {
    return CMSTranslationFlattener.buildSearchQuery(
      searchTerm, 
      'category', 
      locale
    );
  }

  /**
   * Aplana con opciones avanzadas y metadatos
   * 
   * @param category - Categoría a aplanar
   * @param options - Opciones de configuración
   * @returns Categoría aplanada con metadatos
   */
  static flattenWithOptions(
    category: ICategoryResponse,
    options: FlatteningOptions = {}
  ): FlattenedCategory & { 
    available_locales?: string[]; 
    is_fallback?: boolean;
  } {
    const targetLocale = options.locale;
    const flattened = this.flatten(category, targetLocale);

    const result = { ...flattened } as FlattenedCategory & Record<string, unknown>;
    
    if (options.includeAvailableLocales) {
      result.available_locales = CMSTranslationFlattener.getAvailableLocales(
        category, 
        'category'
      );
    }

    if (targetLocale && flattened.current_locale !== targetLocale) {
      result.is_fallback = true;
    }

    return result;
  }

  /**
   * Obtiene idiomas disponibles de una categoría
   * 
   * @param category - Categoría a analizar
   * @returns Array de idiomas
   */
  static getAvailableLocales(category: ICategoryResponse): string[] {
    return CMSTranslationFlattener.getAvailableLocales(category, 'category');
  }

  /**
   * Verifica si una categoría tiene traducción específica
   * 
   * @param category - Categoría a verificar
   * @param locale - Idioma a comprobar
   * @returns true si existe la traducción
   */
  static hasLocale(category: ICategoryResponse, locale: string): boolean {
    return CMSTranslationFlattener.hasLocale(category, locale, 'category');
  }

  /**
   * Construye query para categorías activas
   * 
   * @param locale - Idioma opcional
   * @returns Query de MongoDB
   */
  static buildActiveQuery(locale?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['categories.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para categorías padre (sin parent_id)
   * 
   * @param locale - Idioma opcional
   * @returns Query para categorías raíz
   */
  static buildRootCategoriesQuery(locale?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      parent_id: { $exists: false },
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['categories.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para subcategorías de una categoría padre
   * 
   * @param parentId - ID de la categoría padre
   * @param locale - Idioma opcional
   * @returns Query para subcategorías
   */
  static buildChildrenQuery(parentId: string, locale?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      parent_id: parentId,
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['categories.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para categorías ordenadas
   * 
   * @param locale - Idioma opcional
   * @returns Query con ordenamiento
   */
  static buildOrderedQuery(locale?: string): { filter: Record<string, unknown>; sort: Record<string, number> } {
    const query = this.buildActiveQuery(locale);
    return {
      filter: query,
      sort: { order: 1, createdAt: 1 }
    };
  }

  /**
   * Filtra categorías que tengan un color específico
   * 
   * @param categories - Array de categorías
   * @param color - Color en formato hex
   * @returns Categorías filtradas
   */
  static filterByColor(
    categories: ICategoryResponse[], 
    color: string
  ): ICategoryResponse[] {
    return categories.filter(cat => cat.color === color);
  }

  /**
   * Agrupa categorías por su categoría padre
   * 
   * @param categories - Array de categorías aplanadas
   * @returns Mapa de parent_id -> categorías
   */
  static groupByParent(
    categories: FlattenedCategory[]
  ): Map<string | undefined, FlattenedCategory[]> {
    const groups = new Map<string | undefined, FlattenedCategory[]>();
    
    categories.forEach(category => {
      const parentId = category.parent_id?.toString();
      if (!groups.has(parentId)) {
        groups.set(parentId, []);
      }
      groups.get(parentId)!.push(category);
    });

    return groups;
  }
} 