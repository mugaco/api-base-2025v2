/**
 * Sistema de aplanación de traducciones para entidades CMS
 * 
 * Permite convertir entidades con múltiples traducciones en objetos
 * aplanados con un solo idioma, mejorando la experiencia del frontend.
 */

/**
 * Configuración por entidad CMS
 */
interface CMSEntityConfig {
  translationKey: string;          // 'publications', 'categories', etc.
  primaryField: string;            // 'title', 'name', etc.
  searchableFields: string[];      // Campos para búsqueda
  hasItems?: boolean;             // Solo para Menu
  hasSEO?: boolean;               // Si tiene campos SEO
}

/**
 * Registro de configuraciones por entidad
 */
const CMS_ENTITY_CONFIGS: Record<string, CMSEntityConfig> = {
  publication: {
    translationKey: 'publications',
    primaryField: 'title',
    searchableFields: ['title', 'excerpt', 'body'],
    hasSEO: true
  },
  category: {
    translationKey: 'categories', 
    primaryField: 'name',
    searchableFields: ['name', 'description'],
    hasSEO: true
  },
  tag: {
    translationKey: 'tags',
    primaryField: 'name', 
    searchableFields: ['name', 'description'],
    hasSEO: true
  },
  menu: {
    translationKey: 'menus',
    primaryField: 'name',
    searchableFields: ['name', 'description'],
    hasItems: true,
    hasSEO: false
  }
};

/**
 * Interfaces genéricas para traducciones
 */
interface BaseTranslation {
  locale: string;
  slug: string;
  [key: string]: unknown;
}

interface BaseCMSEntity {
  default_locale: string;
  [key: string]: unknown;
}

/**
 * Clase principal de aplanación de traducciones CMS
 */
export class CMSTranslationFlattener {
  
  /**
   * Aplana una entidad CMS usando configuración automática
   * 
   * @param entity - La entidad CMS con traducciones
   * @param entityType - Tipo de entidad ('publication', 'category', etc.)
   * @param requestedLocale - Idioma solicitado (opcional)
   * @returns Entidad aplanada con el idioma seleccionado
   */
  static flatten<T extends BaseCMSEntity>(
    entity: T,
    entityType: keyof typeof CMS_ENTITY_CONFIGS,
    requestedLocale?: string
  ): T & { current_locale: string } {
    const config = CMS_ENTITY_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Configuración no encontrada para entidad: ${entityType}`);
    }

    return this.flattenWithConfig(entity, config, requestedLocale);
  }

  /**
   * Aplana un array de entidades CMS
   * 
   * @param entities - Array de entidades CMS
   * @param entityType - Tipo de entidad
   * @param requestedLocale - Idioma solicitado (opcional)
   * @returns Array de entidades aplanadas
   */
  static flattenArray<T extends BaseCMSEntity>(
    entities: T[],
    entityType: keyof typeof CMS_ENTITY_CONFIGS,
    requestedLocale?: string
  ): Array<T & { current_locale: string }> {
    return entities.map(entity => 
      this.flatten(entity, entityType, requestedLocale)
    );
  }

  /**
   * Aplana entidad usando configuración específica
   * 
   * @private
   * @param entity - Entidad a aplanar
   * @param config - Configuración de la entidad
   * @param requestedLocale - Idioma solicitado
   * @returns Entidad aplanada
   */
  private static flattenWithConfig<T extends BaseCMSEntity>(
    entity: T,
    config: CMSEntityConfig,
    requestedLocale?: string
  ): T & { current_locale: string } {
    const targetLocale = requestedLocale || entity.default_locale;
    const translations = entity[config.translationKey] as BaseTranslation[];

    if (!translations || !Array.isArray(translations)) {
      return { ...entity, current_locale: targetLocale };
    }

    // 1. Buscar traducción específica
    let selectedTranslation = translations.find(t => t.locale === targetLocale);
    
    // 2. Fallback al idioma por defecto
    if (!selectedTranslation) {
      selectedTranslation = translations.find(t => t.locale === entity.default_locale);
    }
    
    // 3. Fallback a la primera disponible
    if (!selectedTranslation && translations.length > 0) {
      selectedTranslation = translations[0];
    }
    
    if (!selectedTranslation) {
      return { ...entity, current_locale: targetLocale };
    }

    // 4. Crear objeto aplanado
    const { locale, ...translationFields } = selectedTranslation;
    const { [config.translationKey]: _unused, ...baseFields } = entity;
    void _unused; // Explicitly mark as intentionally unused
    
    return {
      ...baseFields,
      ...translationFields,
      current_locale: locale
    } as unknown as T & { current_locale: string };
  }

  /**
   * Construye query de búsqueda para una entidad específica
   * 
   * @param searchTerm - Término de búsqueda
   * @param entityType - Tipo de entidad
   * @param locale - Idioma específico (opcional)
   * @returns Query de MongoDB para búsqueda
   */
  static buildSearchQuery(
    searchTerm: string,
    entityType: keyof typeof CMS_ENTITY_CONFIGS,
    locale?: string
  ): Record<string, unknown> {
    const config = CMS_ENTITY_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Configuración no encontrada para entidad: ${entityType}`);
    }

    const searchConditions = config.searchableFields.map(field => ({
      [`${config.translationKey}.${field}`]: { 
        $regex: searchTerm, 
        $options: 'i' 
      }
    }));

    const query: Record<string, unknown> = {
      $or: searchConditions,
      isDeleted: false
    };

    // Filtrar por idioma si se especifica
    if (locale) {
      query[`${config.translationKey}.locale`] = locale;
    }

    return query;
  }

  /**
   * Extrae idioma preferido de un request HTTP
   * 
   * @param req - Objeto request de Express
   * @returns Idioma extraído o undefined
   */
  static extractLocaleFromRequest(req: unknown): string | undefined {
    const reqObj = req as { query?: Record<string, unknown>; headers?: Record<string, unknown> };

    // 1. De query parameter (prioritario)
    if (reqObj.query?.locale) {
      return reqObj.query.locale as string;
    }

    // 2. De header personalizado
    if (reqObj.headers?.['x-locale']) {
      return reqObj.headers['x-locale'] as string;
    }

    return undefined;
  }

  /**
   * Registra una nueva configuración de entidad CMS
   * 
   * @param entityType - Nombre del tipo de entidad
   * @param config - Configuración de la entidad
   */
  static registerEntityConfig(
    entityType: string, 
    config: CMSEntityConfig
  ): void {
    (CMS_ENTITY_CONFIGS as Record<string, CMSEntityConfig>)[entityType] = config;
  }

  /**
   * Obtiene la configuración de una entidad
   * 
   * @param entityType - Tipo de entidad
   * @returns Configuración de la entidad o null
   */
  static getEntityConfig(entityType: string): CMSEntityConfig | null {
    return CMS_ENTITY_CONFIGS[entityType] || null;
  }

  /**
   * Lista todos los tipos de entidades registradas
   * 
   * @returns Array con los nombres de entidades
   */
  static getRegisteredEntityTypes(): string[] {
    return Object.keys(CMS_ENTITY_CONFIGS);
  }

  /**
   * Auto-detecta el tipo de entidad basado en sus propiedades
   * 
   * @param entity - Entidad a analizar
   * @returns Tipo de entidad detectado o null
   */
  static detectEntityType(entity: Record<string, unknown>): string | null {
    if (entity.publications) return 'publication';
    if (entity.categories) return 'category';
    if (entity.tags) return 'tag';
    if (entity.menus) return 'menu';
    return null;
  }

  /**
   * Obtiene los idiomas disponibles en una entidad
   * 
   * @param entity - Entidad CMS
   * @param entityType - Tipo de entidad (opcional, se auto-detecta)
   * @returns Array de idiomas disponibles
   */
  static getAvailableLocales(
    entity: BaseCMSEntity, 
    entityType?: string
  ): string[] {
    const detectedType = entityType || this.detectEntityType(entity);
    if (!detectedType) return [];

    const config = CMS_ENTITY_CONFIGS[detectedType];
    if (!config) return [];

    const translations = entity[config.translationKey] as BaseTranslation[];
    if (!translations || !Array.isArray(translations)) return [];

    return translations.map(t => t.locale);
  }

  /**
   * Verifica si una entidad tiene traducción para un idioma específico
   * 
   * @param entity - Entidad CMS
   * @param locale - Idioma a verificar
   * @param entityType - Tipo de entidad (opcional)
   * @returns true si existe la traducción
   */
  static hasLocale(
    entity: BaseCMSEntity, 
    locale: string, 
    entityType?: string
  ): boolean {
    const availableLocales = this.getAvailableLocales(entity, entityType);
    return availableLocales.includes(locale);
  }
}

// Exportar también los tipos e interfaces para uso externo
export type { CMSEntityConfig, BaseTranslation, BaseCMSEntity }; 