/**
 * Configuración centralizada del sistema CMS
 * 
 * Centraliza todas las configuraciones relacionadas con:
 * - Idiomas soportados
 * - Idioma por defecto
 * - Mapeos de normalización de idiomas
 * - Configuraciones específicas del CMS
 */

/**
 * Configuración de idiomas del CMS
 */
export interface CMSLocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  enabled: boolean;
  isDefault?: boolean;
}

/**
 * Configuración completa del CMS
 */
export interface CMSConfig {
  locales: CMSLocaleConfig[];
  defaultLocale: string;
  localeMapping: Record<string, string>;
  entityTypes: readonly string[];
  publicationTypes: PublicationTypeConfig[];
  features: {
    autoFlattening: boolean;
    localeDetection: boolean;
    fallbackToDefault: boolean;
  };
}

/**
 * Configuración de idiomas soportados
 */
export const CMS_LOCALES: CMSLocaleConfig[] = [
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    flag: '🇪🇸',
    enabled: true,
    isDefault: true
  },
  {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (United States)',
    flag: '🇺🇸',
    enabled: true
  },
  {
    code: 'ca-ES',
    name: 'Catalan (Spain)',
    nativeName: 'Català (Espanya)',
    flag: 'CAT',
    enabled: true
  }
];

/**
 * Mapeo de códigos de idioma comunes a códigos estándar
 */
export const CMS_LOCALE_MAPPING: Record<string, string> = {
  // Español
  'es': 'es-ES',
  'esp': 'es-ES',
  'spanish': 'es-ES',
  'español': 'es-ES',
  'castellano': 'es-ES',
  
  // Inglés
  'en': 'en-US',
  'eng': 'en-US',
  'english': 'en-US',
  'inglés': 'en-US',
  'ingles': 'en-US',
  
  // Catalán
  'ca': 'ca-ES',
  'cat': 'ca-ES',
  'catalan': 'ca-ES',
  'català': 'ca-ES',
  'catalán': 'ca-ES'
};

/**
 * Tipos de entidades CMS
 */
export const CMS_ENTITY_TYPES = ['publication', 'category', 'tag', 'menu'] as const;

/**
 * Configuración de tipos de publicación
 */
export interface PublicationTypeConfig {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  isDefault?: boolean;
  metadata?: {
    requiresMedia?: boolean;
    hasCategories?: boolean;
    hasTags?: boolean;
    seoRequired?: boolean;
  };
}

/**
 * Tipos de publicación soportados
 */
export const CMS_PUBLICATION_TYPES: PublicationTypeConfig[] = [
  {
    key: 'article',
    name: 'Artículo',
    description: 'Artículo de blog o contenido editorial',
    enabled: true,
    isDefault: true,
    metadata: {
      requiresMedia: false,
      hasCategories: true,
      hasTags: true,
      seoRequired: true
    }
  },
  {
    key: 'page',
    name: 'Página',
    description: 'Página estática del sitio web',
    enabled: true,
    metadata: {
      requiresMedia: false,
      hasCategories: false,
      hasTags: false,
      seoRequired: true
    }
  },
  {
    key: 'product',
    name: 'Producto',
    description: 'Página de producto o servicio',
    enabled: true,
    metadata: {
      requiresMedia: true,
      hasCategories: true,
      hasTags: true,
      seoRequired: true
    }
  },
  {
    key: 'news',
    name: 'Noticia',
    description: 'Noticia o comunicado de prensa',
    enabled: true,
    metadata: {
      requiresMedia: false,
      hasCategories: true,
      hasTags: true,
      seoRequired: true
    }
  },
  {
    key: 'tutorial',
    name: 'Tutorial',
    description: 'Guía o tutorial paso a paso',
    enabled: true,
    metadata: {
      requiresMedia: false,
      hasCategories: true,
      hasTags: true,
      seoRequired: false
    }
  }
];

/**
 * Configuración principal del CMS
 */
export const CMS_CONFIG: CMSConfig = {
  locales: CMS_LOCALES,
  defaultLocale: CMS_LOCALES.find(locale => locale.isDefault)?.code || 'es-ES',
  localeMapping: CMS_LOCALE_MAPPING,
  entityTypes: CMS_ENTITY_TYPES,
  publicationTypes: CMS_PUBLICATION_TYPES,
  features: {
    autoFlattening: true,
    localeDetection: true,
    fallbackToDefault: true
  }
};

/**
 * Utilidades derivadas de la configuración
 */

/**
 * Array de códigos de idiomas soportados
 */
export const CMS_SUPPORTED_LOCALES = CMS_LOCALES
  .filter(locale => locale.enabled)
  .map(locale => locale.code) as readonly string[];

/**
 * Idioma por defecto del CMS
 */
export const CMS_DEFAULT_LOCALE = CMS_CONFIG.defaultLocale;

/**
 * Obtiene la configuración de un idioma específico
 * 
 * @param localeCode - Código del idioma
 * @returns Configuración del idioma o null si no existe
 */
export function getLocaleConfig(localeCode: string): CMSLocaleConfig | null {
  return CMS_LOCALES.find(locale => locale.code === localeCode) || null;
}

/**
 * Verifica si un idioma está soportado y habilitado
 * 
 * @param localeCode - Código del idioma a verificar
 * @returns true si el idioma está soportado
 */
export function isSupportedLocale(localeCode: string): boolean {
  return CMS_SUPPORTED_LOCALES.includes(localeCode);
}

/**
 * Normaliza un código de idioma usando el mapeo configurado
 * 
 * @param input - Código de idioma en cualquier formato
 * @returns Código normalizado o null si no es válido
 */
export function normalizeLocale(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Buscar en el mapeo configurado
  if (CMS_LOCALE_MAPPING[normalized]) {
    return CMS_LOCALE_MAPPING[normalized];
  }
  
  // Verificar si ya está en formato correcto (case-insensitive)
  const supportedMatch = CMS_SUPPORTED_LOCALES.find(
    locale => locale.toLowerCase() === normalized
  );
  if (supportedMatch) {
    return supportedMatch;
  }
  
  return null;
}

/**
 * Obtiene todos los idiomas habilitados con su información completa
 * 
 * @returns Array de configuraciones de idiomas habilitados
 */
export function getEnabledLocales(): CMSLocaleConfig[] {
  return CMS_LOCALES.filter(locale => locale.enabled);
}

/**
 * Obtiene el idioma por defecto con su información completa
 * 
 * @returns Configuración del idioma por defecto
 */
export function getDefaultLocale(): CMSLocaleConfig {
  const defaultLocale = CMS_LOCALES.find(locale => locale.isDefault);
  if (!defaultLocale) {
    throw new Error('No se encontró un idioma por defecto configurado');
  }
  return defaultLocale;
}

/**
 * Array de tipos de publicación habilitados
 */
export const CMS_SUPPORTED_PUBLICATION_TYPES = CMS_PUBLICATION_TYPES
  .filter(type => type.enabled)
  .map(type => type.key) as readonly string[];

/**
 * Tipos de publicación como tuple para Zod
 */
export const CMS_PUBLICATION_TYPES_TUPLE = CMS_SUPPORTED_PUBLICATION_TYPES as readonly [string, ...string[]];

/**
 * Tipo de publicación por defecto
 */
export const CMS_DEFAULT_PUBLICATION_TYPE = CMS_PUBLICATION_TYPES
  .find(type => type.isDefault)?.key || 'article';

/**
 * Obtiene la configuración de un tipo de publicación específico
 */
export function getPublicationTypeConfig(typeKey: string): PublicationTypeConfig | null {
  return CMS_PUBLICATION_TYPES.find(type => type.key === typeKey) || null;
}

/**
 * Verifica si un tipo de publicación está soportado
 */
export function isSupportedPublicationType(typeKey: string): boolean {
  return CMS_SUPPORTED_PUBLICATION_TYPES.includes(typeKey);
}

/**
 * Obtiene todos los tipos de publicación habilitados
 */
export function getEnabledPublicationTypes(): PublicationTypeConfig[] {
  return CMS_PUBLICATION_TYPES.filter(type => type.enabled);
}

/**
 * Valida si la configuración CMS es válida
 * 
 * @returns true si la configuración es válida
 * @throws Error si hay problemas en la configuración
 */
export function validateCMSConfig(): boolean {
  // Verificar que hay al menos un idioma
  if (CMS_LOCALES.length === 0) {
    throw new Error('Debe haber al menos un idioma configurado');
  }
  
  // Verificar que hay exactamente un idioma por defecto
  const defaultLocales = CMS_LOCALES.filter(locale => locale.isDefault);
  if (defaultLocales.length === 0) {
    throw new Error('Debe haber un idioma marcado como por defecto');
  }
  if (defaultLocales.length > 1) {
    throw new Error('Solo puede haber un idioma marcado como por defecto');
  }
  
  // Verificar que el idioma por defecto está habilitado
  const defaultLocale = defaultLocales[0];
  if (!defaultLocale.enabled) {
    throw new Error('El idioma por defecto debe estar habilitado');
  }
  
  // Verificar códigos únicos
  const codes = CMS_LOCALES.map(locale => locale.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    throw new Error('Los códigos de idioma deben ser únicos');
  }
  
  // Validar tipos de publicación
  if (CMS_PUBLICATION_TYPES.length === 0) {
    throw new Error('Debe haber al menos un tipo de publicación configurado');
  }
  
  // Verificar que hay exactamente un tipo por defecto
  const defaultPublicationTypes = CMS_PUBLICATION_TYPES.filter(type => type.isDefault);
  if (defaultPublicationTypes.length === 0) {
    throw new Error('Debe haber un tipo de publicación marcado como por defecto');
  }
  if (defaultPublicationTypes.length > 1) {
    throw new Error('Solo puede haber un tipo de publicación marcado como por defecto');
  }
  
  // Verificar que el tipo por defecto está habilitado
  const defaultType = defaultPublicationTypes[0];
  if (!defaultType.enabled) {
    throw new Error('El tipo de publicación por defecto debe estar habilitado');
  }
  
  // Verificar claves únicas
  const keys = CMS_PUBLICATION_TYPES.map(type => type.key);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    throw new Error('Las claves de tipos de publicación deben ser únicas');
  }
  
  return true;
}

// Validar configuración al cargar el módulo
validateCMSConfig(); 