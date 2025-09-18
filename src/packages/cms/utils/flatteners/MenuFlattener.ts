/**
 * Flattener específico para entidades Menu
 * 
 * Proporciona métodos type-safe para aplanar menús
 * con funcionalidades específicas para navegación.
 */

import { CMSTranslationFlattener } from '../CMSTranslationFlattener';
import { IMenuResponse } from '@packages/cms/entities/Menu/MenuSchema';
import { FlattenedMenu, FlatteningOptions } from '../types/FlattenedTypes';

export class MenuFlattener {
  
  /**
   * Aplana un menú a un idioma específico
   * 
   * @param menu - Menú con traducciones
   * @param locale - Idioma deseado (opcional)
   * @returns Menú aplanado
   */
  static flatten(
    menu: IMenuResponse,
    locale?: string
  ): FlattenedMenu {
    return CMSTranslationFlattener.flatten(
      menu, 
      'menu', 
      locale
    ) as unknown as FlattenedMenu;
  }

  /**
   * Aplana un array de menús
   * 
   * @param menus - Array de menús
   * @param locale - Idioma deseado (opcional)
   * @returns Array de menús aplanados
   */
  static flattenArray(
    menus: IMenuResponse[],
    locale?: string
  ): FlattenedMenu[] {
    return CMSTranslationFlattener.flattenArray(
      menus, 
      'menu', 
      locale
    ) as unknown as FlattenedMenu[];
  }

  /**
   * Construye query de búsqueda específico para menús
   * 
   * @param searchTerm - Término de búsqueda
   * @param locale - Idioma específico (opcional)
   * @returns Query optimizado para MongoDB
   */
  static buildSearchQuery(searchTerm: string, locale?: string): Record<string, unknown> {
    return CMSTranslationFlattener.buildSearchQuery(
      searchTerm, 
      'menu', 
      locale
    );
  }

  /**
   * Aplana con opciones avanzadas y metadatos
   * 
   * @param menu - Menú a aplanar
   * @param options - Opciones de configuración
   * @returns Menú aplanado con metadatos
   */
  static flattenWithOptions(
    menu: IMenuResponse,
    options: FlatteningOptions = {}
  ): FlattenedMenu & { 
    available_locales?: string[]; 
    is_fallback?: boolean;
  } {
    const targetLocale = options.locale;
    const flattened = this.flatten(menu, targetLocale);

    const result = { ...flattened } as FlattenedMenu & Record<string, unknown>;
    
    if (options.includeAvailableLocales) {
      result.available_locales = CMSTranslationFlattener.getAvailableLocales(
        menu, 
        'menu'
      );
    }

    if (targetLocale && flattened.current_locale !== targetLocale) {
      result.is_fallback = true;
    }

    return result;
  }

  /**
   * Obtiene idiomas disponibles de un menú
   * 
   * @param menu - Menú a analizar
   * @returns Array de idiomas
   */
  static getAvailableLocales(menu: IMenuResponse): string[] {
    return CMSTranslationFlattener.getAvailableLocales(menu, 'menu');
  }

  /**
   * Verifica si un menú tiene traducción específica
   * 
   * @param menu - Menú a verificar
   * @param locale - Idioma a comprobar
   * @returns true si existe la traducción
   */
  static hasLocale(menu: IMenuResponse, locale: string): boolean {
    return CMSTranslationFlattener.hasLocale(menu, locale, 'menu');
  }

  /**
   * Construye query para menús activos
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
      query['menus.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para menús por ubicación
   * 
   * @param location - Ubicación del menú
   * @param locale - Idioma opcional
   * @returns Query filtrado por ubicación
   */
  static buildLocationQuery(
    location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom',
    locale?: string
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      location,
      isActive: true,
      isDeleted: false
    };

    if (locale) {
      query['menus.locale'] = locale;
    }

    return query;
  }

  /**
   * Construye query para menú principal (header)
   * 
   * @param locale - Idioma opcional
   * @returns Query para menú de header
   */
  static buildMainMenuQuery(locale?: string): Record<string, unknown> {
    return this.buildLocationQuery('header', locale);
  }

  /**
   * Construye query para menú de pie de página
   * 
   * @param locale - Idioma opcional
   * @returns Query para menú de footer
   */
  static buildFooterMenuQuery(locale?: string): Record<string, unknown> {
    return this.buildLocationQuery('footer', locale);
  }

  /**
   * Construye query para menú móvil
   * 
   * @param locale - Idioma opcional
   * @returns Query para menú móvil
   */
  static buildMobileMenuQuery(locale?: string): Record<string, unknown> {
    return this.buildLocationQuery('mobile', locale);
  }

  /**
   * Filtra menús por ubicación
   * 
   * @param menus - Array de menús
   * @param location - Ubicación a filtrar
   * @returns Menús filtrados
   */
  static filterByLocation(
    menus: IMenuResponse[], 
    location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
  ): IMenuResponse[] {
    return menus.filter(menu => menu.location === location);
  }

  /**
   * Agrupa menús por ubicación
   * 
   * @param menus - Array de menús aplanados
   * @returns Mapa de ubicación -> menús
   */
  static groupByLocation(
    menus: FlattenedMenu[]
  ): Map<string, FlattenedMenu[]> {
    const groups = new Map<string, FlattenedMenu[]>();
    
    menus.forEach(menu => {
      const location = menu.location;
      if (!groups.has(location)) {
        groups.set(location, []);
      }
      groups.get(location)!.push(menu);
    });

    return groups;
  }

  /**
   * Extrae todos los links de un menú aplanado
   * 
   * @param menu - Menú aplanado
   * @returns Array de URLs únicas
   */
  static extractLinks(menu: FlattenedMenu): string[] {
    if (!menu.items || !Array.isArray(menu.items)) {
      return [];
    }

    const links = new Set<string>();
    
    const extractFromItems = (items: Array<Record<string, unknown>>): void => {
      items.forEach(item => {
        if (item.url && item.type === 'link') {
          links.add(item.url as string);
        }
        if (item.children && Array.isArray(item.children)) {
          extractFromItems(item.children as Array<Record<string, unknown>>);
        }
      });
    };

    extractFromItems(menu.items);
    return Array.from(links);
  }

  /**
   * Cuenta el número total de elementos en un menú
   * 
   * @param menu - Menú aplanado
   * @returns Número total de elementos
   */
  static countMenuItems(menu: FlattenedMenu): number {
    if (!menu.items || !Array.isArray(menu.items)) {
      return 0;
    }

    let count = 0;
    
    const countItems = (items: Array<Record<string, unknown>>): void => {
      items.forEach(item => {
        count++;
        if (item.children && Array.isArray(item.children)) {
          countItems(item.children);
        }
      });
    };

    countItems(menu.items);
    return count;
  }

  /**
   * Filtra elementos del menú por estado activo
   * 
   * @param menu - Menú aplanado
   * @returns Menú con solo elementos activos
   */
  static filterActiveItems(menu: FlattenedMenu): FlattenedMenu {
    if (!menu.items || !Array.isArray(menu.items)) {
      return menu;
    }

    const filterItems = (items: Array<Record<string, unknown>>): Array<Record<string, unknown>> => {
      return items
        .filter(item => item.isActive !== false)
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children as Array<Record<string, unknown>>) : undefined
        }));
    };

    return {
      ...menu,
      items: filterItems(menu.items)
    };
  }

  /**
   * Ordena elementos del menú por el campo order
   * 
   * @param menu - Menú aplanado
   * @returns Menú con elementos ordenados
   */
  static sortMenuItems(menu: FlattenedMenu): FlattenedMenu {
    if (!menu.items || !Array.isArray(menu.items)) {
      return menu;
    }

    const sortItems = (items: Array<Record<string, unknown>>): Array<Record<string, unknown>> => {
      return items
        .sort((a, b) => ((a.order as number) || 0) - ((b.order as number) || 0))
        .map(item => ({
          ...item,
          children: item.children ? sortItems(item.children as Array<Record<string, unknown>>) : undefined
        }));
    };

    return {
      ...menu,
      items: sortItems(menu.items)
    };
  }

  /**
   * Busca un elemento específico en el menú por URL
   * 
   * @param menu - Menú aplanado
   * @param url - URL a buscar
   * @returns Elemento encontrado o null
   */
  static findItemByUrl(menu: FlattenedMenu, url: string): Record<string, unknown> | null {
    if (!menu.items || !Array.isArray(menu.items)) {
      return null;
    }

    const searchInItems = (items: Array<Record<string, unknown>>): Record<string, unknown> | null => {
      for (const item of items) {
        if (item.url === url) {
          return item;
        }
        if (item.children && Array.isArray(item.children)) {
          const found = searchInItems(item.children as Array<Record<string, unknown>>);
          if (found) return found;
        }
      }
      return null;
    };

    return searchInItems(menu.items);
  }
} 