/**
 * Tipos TypeScript para entidades CMS aplanadas
 * 
 * Define las interfaces específicas para cada entidad una vez que
 * se han aplanado sus traducciones a un solo idioma.
 */

import { IPublicationResponse } from '@packages/cms/entities/Publication/PublicationSchema';
import { ICategoryResponse } from '@packages/cms/entities/Category/CategorySchema';
import { ITagResponse } from '@packages/cms/entities/Tag/TagSchema';
import { IMenuResponse } from '@packages/cms/entities/Menu/MenuSchema';

/**
 * Campos de traducción de Publication
 */
interface PublicationTranslationFields {
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

/**
 * Campos de traducción de Category
 */
interface CategoryTranslationFields {
  locale: string;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

/**
 * Campos de traducción de Tag
 */
interface TagTranslationFields {
  locale: string;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

/**
 * Campos de traducción de Menu
 */
interface MenuTranslationFields {
  locale: string;
  name: string;
  slug: string;
  description?: string;
  items?: Array<{
    type?: 'link' | 'dropdown' | 'separator';
    label?: string;
    url?: string;
    target?: '_self' | '_blank' | '_parent' | '_top';
    children?: Record<string, unknown>[];
    isActive?: boolean;
    order?: number;
  }>;
}

/**
 * Publication aplanada
 * Omite el array de traducciones y añade campos directos + current_locale
 */
export type FlattenedPublication = Omit<IPublicationResponse, 'publications'> & 
  Omit<PublicationTranslationFields, 'locale'> & 
  { current_locale: string };

/**
 * Category aplanada
 */
export type FlattenedCategory = Omit<ICategoryResponse, 'categories'> & 
  Omit<CategoryTranslationFields, 'locale'> & 
  { current_locale: string };

/**
 * Tag aplanado
 */
export type FlattenedTag = Omit<ITagResponse, 'tags'> & 
  Omit<TagTranslationFields, 'locale'> & 
  { current_locale: string };

/**
 * Menu aplanado
 */
export type FlattenedMenu = Omit<IMenuResponse, 'menus'> & 
  Omit<MenuTranslationFields, 'locale'> & 
  { current_locale: string };

/**
 * Union type para cualquier entidad CMS aplanada
 */
export type FlattenedCMSEntity = 
  | FlattenedPublication
  | FlattenedCategory 
  | FlattenedTag
  | FlattenedMenu;

/**
 * Utilidad para respuestas paginadas con entidades aplanadas
 */
export interface FlattenedPaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Opciones de configuración para flattening
 */
export interface FlatteningOptions {
  locale?: string;
  fallbackToDefault?: boolean;
  includeAvailableLocales?: boolean;
}

/**
 * Resultado extendido con metadatos de idioma
 */
export type FlattenedWithMetadata<T> = T & {
  current_locale: string;
  available_locales?: string[];
  is_fallback?: boolean;
  default_locale?: string;
}; 