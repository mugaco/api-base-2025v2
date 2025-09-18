/**
 * Flattener específico para entidades Tag
 * 
 * Proporciona métodos type-safe para aplanar etiquetas
 * con funcionalidades específicas como filtrado por uso.
 */

import { CMSTranslationFlattener } from '../CMSTranslationFlattener';
import { ITagResponse } from '@packages/cms/entities/Tag/TagSchema';
import { FlattenedTag, FlatteningOptions } from '../types/FlattenedTypes';

export class TagFlattener {
  
  /**
   * Aplana un tag a un idioma específico
   * 
   * @param tag - Tag con traducciones
   * @param locale - Idioma deseado (opcional)
   * @returns Tag aplanado
   */
  static flatten(
    tag: ITagResponse,
    locale?: string
  ): FlattenedTag {
    return CMSTranslationFlattener.flatten(
      tag, 
      'tag', 
      locale
    ) as unknown as FlattenedTag;
  }

  /**
   * Aplana un array de tags
   * 
   * @param tags - Array de tags
   * @param locale - Idioma deseado (opcional)
   * @returns Array de tags aplanados
   */
  static flattenArray(
    tags: ITagResponse[],
    locale?: string
  ): FlattenedTag[] {
    return CMSTranslationFlattener.flattenArray(
      tags, 
      'tag', 
      locale
    ) as unknown as FlattenedTag[];
  }

  /**
   * Construye query de búsqueda específico para tags
   * 
   * @param searchTerm - Término de búsqueda
   * @param locale - Idioma específico (opcional)
   * @returns Query optimizado para MongoDB
   */
  static buildSearchQuery(searchTerm: string, locale?: string): Record<string, unknown> {
    return CMSTranslationFlattener.buildSearchQuery(
      searchTerm, 
      'tag', 
      locale
    );
  }

  /**
   * Aplana con opciones avanzadas y metadatos
   * 
   * @param tag - Tag a aplanar
   * @param options - Opciones de configuración
   * @returns Tag aplanado con metadatos
   */
  static flattenWithOptions(
    tag: ITagResponse,
    options: FlatteningOptions = {}
  ): FlattenedTag & { 
    available_locales?: string[]; 
    is_fallback?: boolean;
  } {
    const targetLocale = options.locale;
    const flattened = this.flatten(tag, targetLocale);

    const result = { ...flattened } as FlattenedTag & Record<string, unknown>;
    
    if (options.includeAvailableLocales) {
      result.available_locales = CMSTranslationFlattener.getAvailableLocales(
        tag, 
        'tag'
      );
    }

    if (targetLocale && flattened.current_locale !== targetLocale) {
      result.is_fallback = true;
    }

    return result;
  }

  /**
   * Obtiene idiomas disponibles de un tag
   * 
   * @param tag - Tag a analizar
   * @returns Array de idiomas
   */
  static getAvailableLocales(tag: ITagResponse): string[] {
    return CMSTranslationFlattener.getAvailableLocales(tag, 'tag');
  }

  /**
   * Verifica si un tag tiene traducción específica
   * 
   * @param tag - Tag a verificar
   * @param locale - Idioma a comprobar
   * @returns true si existe la traducción
   */
  static hasLocale(tag: ITagResponse, locale: string): boolean {
    return CMSTranslationFlattener.hasLocale(tag, locale, 'tag');
  }

  /**
   * Construye query para tags activos
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
      query['tags.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para tags populares (más usados)
   * 
   * @param limit - Límite de tags (default: 10)
   * @param locale - Idioma opcional
   * @returns Query con ordenamiento por uso
   */
  static buildPopularQuery(limit: number = 10, locale?: string): Record<string, unknown> {
    const query = this.buildActiveQuery(locale);
    return {
      filter: query,
      sort: { usageCount: -1 },
      limit
    };
  }

  /**
   * Construye query para tags sin usar
   * 
   * @param locale - Idioma opcional
   * @returns Query para tags con usageCount = 0
   */
  static buildUnusedQuery(locale?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      usageCount: 0,
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['tags.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para tags por color
   * 
   * @param color - Color en formato hex
   * @param locale - Idioma opcional
   * @returns Query filtrado por color
   */
  static buildColorQuery(color: string, locale?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      color,
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['tags.locale'] = locale;
    }

    return query;
  }

  /**
   * Filtra tags por rango de uso
   * 
   * @param tags - Array de tags
   * @param minUsage - Uso mínimo
   * @param maxUsage - Uso máximo (opcional)
   * @returns Tags filtrados
   */
  static filterByUsageRange(
    tags: ITagResponse[], 
    minUsage: number, 
    maxUsage?: number
  ): ITagResponse[] {
    return tags.filter(tag => {
      if (maxUsage !== undefined) {
        return tag.usageCount >= minUsage && tag.usageCount <= maxUsage;
      }
      return tag.usageCount >= minUsage;
    });
  }

  /**
   * Agrupa tags por color
   * 
   * @param tags - Array de tags aplanados
   * @returns Mapa de color -> tags
   */
  static groupByColor(
    tags: FlattenedTag[]
  ): Map<string | undefined, FlattenedTag[]> {
    const groups = new Map<string | undefined, FlattenedTag[]>();
    
    tags.forEach(tag => {
      const color = tag.color;
      if (!groups.has(color)) {
        groups.set(color, []);
      }
      groups.get(color)!.push(tag);
    });

    return groups;
  }

  /**
   * Ordena tags por popularidad (uso descendente)
   * 
   * @param tags - Array de tags
   * @returns Tags ordenados por uso
   */
  static sortByPopularity(tags: ITagResponse[]): ITagResponse[] {
    return [...tags].sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Obtiene los colores únicos de un conjunto de tags
   * 
   * @param tags - Array de tags
   * @returns Array de colores únicos
   */
  static getUniqueColors(tags: ITagResponse[]): string[] {
    const colors = new Set<string>();
    tags.forEach(tag => {
      if (tag.color) {
        colors.add(tag.color);
      }
    });
    return Array.from(colors);
  }
} 