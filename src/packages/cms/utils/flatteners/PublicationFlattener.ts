/**
 * Flattener específico para entidades Publication
 * 
 * Proporciona métodos type-safe para aplanar publicaciones
 * con autocompletado completo de TypeScript.
 */

import { CMSTranslationFlattener } from '../CMSTranslationFlattener';
import { IPublicationResponse } from '@packages/cms/entities/Publication/PublicationSchema';
import { FlattenedPublication, FlatteningOptions } from '../types/FlattenedTypes';

export class PublicationFlattener {
  
  /**
   * Aplana una publicación a un idioma específico
   * 
   * @param publication - Publicación con traducciones
   * @param locale - Idioma deseado (opcional)
   * @returns Publicación aplanada con type safety completo
   */
  static flatten(
    publication: IPublicationResponse,
    locale?: string
  ): FlattenedPublication {
    return CMSTranslationFlattener.flatten(
      publication, 
      'publication', 
      locale
    ) as unknown as FlattenedPublication;
  }

  /**
   * Aplana un array de publicaciones
   * 
   * @param publications - Array de publicaciones
   * @param locale - Idioma deseado (opcional)
   * @returns Array de publicaciones aplanadas
   */
  static flattenArray(
    publications: IPublicationResponse[],
    locale?: string
  ): FlattenedPublication[] {
    return CMSTranslationFlattener.flattenArray(
      publications, 
      'publication', 
      locale
    ) as unknown as FlattenedPublication[];
  }

  /**
   * Construye query de búsqueda específico para publicaciones
   * 
   * @param searchTerm - Término de búsqueda
   * @param locale - Idioma específico (opcional)
   * @returns Query optimizado para MongoDB
   */
  static buildSearchQuery(searchTerm: string, locale?: string): Record<string, unknown> {
    return CMSTranslationFlattener.buildSearchQuery(
      searchTerm, 
      'publication', 
      locale
    );
  }

  /**
   * Aplana con opciones avanzadas y metadatos
   * 
   * @param publication - Publicación a aplanar
   * @param options - Opciones de configuración
   * @returns Publicación aplanada con metadatos opcionales
   */
  static flattenWithOptions(
    publication: IPublicationResponse,
    options: FlatteningOptions = {}
  ): FlattenedPublication & { 
    available_locales?: string[]; 
    is_fallback?: boolean;
  } {
    const targetLocale = options.locale;
    const flattened = this.flatten(publication, targetLocale);

    // Añadir metadatos si se solicita
    const result = { ...flattened } as FlattenedPublication & Record<string, unknown>;
    
    if (options.includeAvailableLocales) {
      result.available_locales = CMSTranslationFlattener.getAvailableLocales(
        publication, 
        'publication'
      );
    }

    // Detectar si se usó fallback
    if (targetLocale && flattened.current_locale !== targetLocale) {
      result.is_fallback = true;
    }

    return result;
  }

  /**
   * Obtiene todas las traducciones disponibles de una publicación
   * 
   * @param publication - Publicación a analizar
   * @returns Array de idiomas disponibles
   */
  static getAvailableLocales(publication: IPublicationResponse): string[] {
    return CMSTranslationFlattener.getAvailableLocales(publication, 'publication');
  }

  /**
   * Verifica si una publicación tiene traducción en un idioma específico
   * 
   * @param publication - Publicación a verificar
   * @param locale - Idioma a comprobar
   * @returns true si existe la traducción
   */
  static hasLocale(publication: IPublicationResponse, locale: string): boolean {
    return CMSTranslationFlattener.hasLocale(publication, locale, 'publication');
  }

  /**
   * Filtra publicaciones que tengan traducción en un idioma específico
   * 
   * @param publications - Array de publicaciones
   * @param locale - Idioma requerido
   * @returns Publicaciones que tienen el idioma
   */
  static filterByLocale(
    publications: IPublicationResponse[], 
    locale: string
  ): IPublicationResponse[] {
    return publications.filter(pub => this.hasLocale(pub, locale));
  }

  /**
   * Construye query para buscar publicaciones por tipo
   * 
   * @param type - Tipo de publicación ('article', 'news', etc.)
   * @param locale - Idioma opcional
   * @returns Query de MongoDB
   */
  static buildTypeQuery(
    type: 'article' | 'page' | 'product' | 'news' | 'tutorial',
    locale?: string
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      type,
      isDeleted: false
    };

    if (locale) {
      query['publications.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para buscar publicaciones por estado
   * 
   * @param status - Estado de la publicación
   * @param locale - Idioma opcional
   * @returns Query de MongoDB
   */
  static buildStatusQuery(
    status: 'draft' | 'published' | 'archived',
    locale?: string
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      status,
      isDeleted: false
    };

    if (locale) {
      query['publications.locale'] = locale;
    }

    return query;
  }
} 