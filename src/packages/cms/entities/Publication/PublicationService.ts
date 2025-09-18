/**
 * Servicio para Publication
 */
import { BaseService } from '@core/base/BaseService';
import { PublicationRepository } from './PublicationRepository';
import { IPublication } from './PublicationModel';
// import { IMedia } from '@packages/media/entities/Media/MediaModel';
import { MediaService } from '@packages/media/entities/Media/MediaService';
import { ICreatePublication, IUpdatePublication, IPublicationResponse, IMediaPublication } from './PublicationSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';
import { useBadRequestError, useNotFoundError } from '@core/hooks/useError';
import { CMS_SUPPORTED_PUBLICATION_TYPES } from '@packages/cms/config/cms.config';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Servicio para la entidad Publication heredando de BaseService
 */
export class PublicationService extends BaseService<IPublication, IPublicationResponse, ICreatePublication, IUpdatePublication> {
  private logger: ILoggerService;

  constructor(
    publicationRepository: PublicationRepository,
    private mediaService: MediaService
  ) {
    super(publicationRepository);
    this.logger = Container.resolve<ILoggerService>('loggerService');
  }

  // Aquí puedes sobrescribir métodos de BaseService si necesitas
  // comportamiento específico para Publication. Por ejemplo:

  // async create(data: ICreatePublication): Promise<IPublicationResponse> {
  //   // Lógica específica antes de crear
  //   // Por ejemplo, validaciones adicionales o transformación de datos
  //
  //   const result = await super.create(data);
  //
  //   // Lógica específica después de crear
  //   // Por ejemplo, enviar notificaciones o actualizar caché
  //
  //   return result;
  // }

  /**
   * Obtener publicación por slug y locale
   * Aprovecha el índice único de publications.slug + publications.locale
   */
  async getBySlug(slug: string, locale: string): Promise<IPublicationResponse> {
    try {
      // Construir query para buscar por slug y locale en el array publications
      const query = {
        isDeleted: false,
        'publications.slug': slug,
        'publications.locale': locale
      };

      const result = await this.findOne(query);
      
      if (!result) {
        throw useNotFoundError(`Publicación con slug '${slug}' y locale '${locale}' no encontrada`);
      }

      return result;
    } catch (error) {
      // Si es un error de nuestros hooks, re-lanzarlo tal como está
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw new Error(`Error obteniendo publicación por slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPublicationMedia(publication_id: string): Promise<IMediaPublication> {
    const publication = await this.getById(publication_id);
    
    // Inicializar respuesta
    const result: IMediaPublication = {
      featured: null,
      gallery: []
    };
    
    // Obtener imagen destacada
    if (publication.media_id) {
      try {
        result.featured = await this.mediaService.getById(publication.media_id.toString());
      } catch (error: unknown) {
        // Si no encuentra la imagen destacada, mantener como null
        this.logger.debug('Imagen destacada no encontrada', { publicationId: publication_id, mediaId: publication.media_id, error });
        result.featured = null;
      }
    }
    
    // Obtener galería
    if (publication.media_ids && publication.media_ids.length > 0) {
      const galleryIds = publication.media_ids.map(id => id.toString());
      try {
        result.gallery = await this.mediaService.getAll({
          _id: { $in: galleryIds }
        });
      } catch (error) {
        this.logger.error('Error fetching gallery media', { error, galleryIds });
        // Si hay error obteniendo la galería, mantener array vacío
        result.gallery = [];
      }
    }
    
    return result;
  }

  async create(data: ICreatePublication): Promise<IPublicationResponse> {
    // Validar cada slug antes de crear
    for (const publication of data.publications) {
      const validation = await this.validateSlug(publication.slug, publication.locale);
      if (!validation.available) {
        throw useBadRequestError(
          `El slug '${publication.slug}' ya existe para el idioma '${publication.locale}'`,
          'SLUG_ALREADY_EXISTS',
          {
            field: 'slug',
            value: publication.slug,
            locale: publication.locale,
            suggestions: validation.suggestions,
            conflict: validation.conflict
          }
        );
      }
    }

    const result = await super.create(data);
    return result as IPublicationResponse;
  }

  async update(_id: string, data: IUpdatePublication): Promise<IPublicationResponse> {
    const result = await super.update(_id, data);
    if (!result) {
      throw new Error(`Publication with _id ${_id} not found`);
    }
    return result as IPublicationResponse;
  }

  async delete(_id: string): Promise<boolean> {
    return super.delete(_id);
  }

  async getPaginated(
    query: Record<string, unknown>,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<IPublicationResponse>> {
    // Asegurar que solo se recuperan elementos no eliminados
    query = { ...query, isDeleted: false };
    const result = await super.getPaginated(
      query,
      paginationParams,
      options
    );
    return {
      ...result,
      data: result.data as IPublicationResponse[]
    };
  }






  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<IPublicationResponse>> {
    // Extraer parámetros de paginación
    const { page = 1, itemsPerPage = 10 } = paginationParams;

    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        // Ajusta los campos según tu modelo
        // { name: { $regex: searchTerm, $options: 'i' } },
        // { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Asegurar que solo se muestren elementos no eliminados
    query.isDeleted = false;

    // Usar el método findPaginated del repositorio
    const result = await this.repository.findPaginated(
      query,
      { page, itemsPerPage },
      options
    );

    return {
      ...result,
      data: result.data as IPublicationResponse[]
    };
  }

  // NUEVOS MÉTODOS CRÍTICOS PARA GESTIÓN POR IDIOMA

  /**
   * ENDPOINT 6: Validar slug único por idioma
   */
  async validateSlug(slug: string, locale: string, excludeId?: string): Promise<{
    slug: string;
    locale: string;
    available: boolean;
    conflict?: {
      publicationId: string;
      title: string;
    };
    suggestions: string[];
  }> {
    try {
      // Construir query para buscar slug en el idioma específico
      const query: Record<string, unknown> = {
        isDeleted: false,
        'publications.locale': locale,
        'publications.slug': slug
      };

      // Excluir una publicación específica si se proporciona
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      // Buscar si existe conflicto
      const existingPublication = await this.repository.findOne(query);

      if (existingPublication) {
        // Encontrar la traducción específica para obtener el título
        const translation = existingPublication.publications.find(p => p.locale === locale);

        return {
          slug,
          locale,
          available: false,
          conflict: {
            publicationId: existingPublication._id.toString(),
            title: translation?.title || 'Sin título'
          },
          suggestions: this.generateSlugSuggestions(slug)
        };
      }

      return {
        slug,
        locale,
        available: true,
        suggestions: []
      };
    } catch (error) {
      throw new Error(`Error validating slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ENDPOINT 2: Actualizar contenido por idioma específico
   */
  async updateByLocale(_id: string, locale: string, localeData: {
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    seo?: {
      meta_title?: string;
      meta_description?: string;
      keywords?: string[];
    };
  }): Promise<{
    locale: string;
    title: string;
    slug: string;
    lastModified: Date;
    isComplete: boolean;
    changes: {
      fieldsModified: string[];
      previousSlug?: string;
    };
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);

      // Buscar la traducción existente para este idioma
      const existingTranslationIndex = publication.publications.findIndex(p => p.locale === locale);
      if (existingTranslationIndex === -1) {
        throw useNotFoundError(`Idioma '${locale}' no encontrado en la publicación ${_id}. Usa createByLocale para crear una nueva traducción.`);
      }

      // Validar slug único en este idioma (excluyendo la publicación actual)
      const slugValidation = await this.validateSlug(localeData.slug, locale, _id);
      if (!slugValidation.available) {
        throw useBadRequestError(
          `El slug '${localeData.slug}' ya existe para el idioma '${locale}'`,
          'SLUG_ALREADY_EXISTS',
          {
            field: 'slug',
            value: localeData.slug,
            locale: locale,
            suggestions: slugValidation.suggestions,
            conflict: slugValidation.conflict
          }
        );
      }

      const existingTranslation = publication.publications[existingTranslationIndex];
      const previousSlug = existingTranslation.slug;

      // Actualizar solo los campos proporcionados, manteniendo el status y locale actuales
      publication.publications[existingTranslationIndex] = {
        ...existingTranslation,
        locale: locale, // Preservar explícitamente el locale
        title: localeData.title,
        slug: localeData.slug,
        excerpt: localeData.excerpt || '',
        body: localeData.body,
        seo: localeData.seo || {},
        status: existingTranslation.status
      };

      publication.updatedAt = new Date();
      const updatedPublication = await this.repository.update(_id, publication);

      if (!updatedPublication) {
        throw useNotFoundError(`No se pudo actualizar la publicación ${_id} para el idioma ${locale}`);
      }

      // Determinar campos modificados
      const fieldsModified = Object.keys(localeData);

      return {
        locale,
        title: localeData.title,
        slug: localeData.slug,
        lastModified: new Date(),
        isComplete: !!(localeData.title && localeData.slug && localeData.body),
        changes: {
          fieldsModified,
          previousSlug: previousSlug !== localeData.slug ? previousSlug : undefined
        }
      };
    } catch (error) {
      // Si es un error de nuestros hooks, re-lanzarlo tal como está
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      // Para otros errores, usar un error genérico del servidor
      throw new Error(`Error updating publication by locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ENDPOINT 2b: Crear nueva traducción basada en idioma default
   */
  async createByLocale(_id: string, locale: string): Promise<{
    locale: string;
    title: string;
    slug: string;
    lastModified: Date;
    message: string;
    createdFrom: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);

      // Verificar que el idioma no existe ya
      const existingTranslation = publication.publications.find(p => p.locale === locale);
      if (existingTranslation) {
        throw new Error(`Locale '${locale}' already exists in publication ${_id}`);
      }

      // Obtener la traducción del idioma default
      const defaultTranslation = publication.publications.find(p => p.locale === publication.default_locale);
      if (!defaultTranslation) {
        throw new Error(`Default locale '${publication.default_locale}' not found in publication ${_id}`);
      }

      // Validar que el nuevo slug será único
      const newSlug = `${defaultTranslation.slug}-${locale}`;
      const slugValidation = await this.validateSlug(newSlug, locale, _id);
      if (!slugValidation.available) {
        throw new Error(`Generated slug '${newSlug}' already exists for locale '${locale}'`);
      }

      // Crear nueva traducción basada en el idioma default
      const newTranslation = {
        status: 'draft' as const,
        locale,
        title: `${defaultTranslation.title}-${locale}`,
        slug: newSlug,
        excerpt: 'Contenido pendiente...',
        body: 'Contenido pendiente...',
        seo: {
          meta_title: defaultTranslation.seo?.meta_title
            ? `${defaultTranslation.seo.meta_title}-${locale}`
            : 'Contenido pendiente...',
          meta_description: defaultTranslation.seo?.meta_description
            ? `${defaultTranslation.seo.meta_description}-${locale}`
            : 'Contenido pendiente...',
          keywords: defaultTranslation.seo?.keywords
            ? [...defaultTranslation.seo.keywords]
            : []
        }
      };

      // Añadir la nueva traducción
      publication.publications.push(newTranslation);
      publication.updatedAt = new Date();

      const updatedPublication = await this.repository.update(_id, publication);

      if (!updatedPublication) {
        throw new Error(`Failed to create locale ${locale} for publication ${_id}`);
      }

      return {
        locale,
        title: newTranslation.title,
        slug: newTranslation.slug,
        lastModified: new Date(),
        message: `Locale '${locale}' created successfully based on '${publication.default_locale}'`,
        createdFrom: publication.default_locale
      };
    } catch (error) {
      throw new Error(`Error creating locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ENDPOINT 3: Eliminar idioma específico
   */
  async deleteByLocale(_id: string, locale: string): Promise<{
    message: string;
    deletedLocale: string;
    remainingLocales: string[];
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);

      // Verificar que no sea el idioma por defecto
      if (publication.default_locale === locale) {
        throw new Error(`Cannot delete default locale '${locale}'. Change default_locale first.`);
      }

      // Verificar que el idioma existe en la publicación
      const translationExists = publication.publications.some(p => p.locale === locale);
      if (!translationExists) {
        throw new Error(`Locale '${locale}' not found in publication ${_id}`);
      }

      // Verificar que no sea el único idioma
      if (publication.publications.length <= 1) {
        throw new Error('Cannot delete the only remaining translation');
      }

      // Eliminar la traducción específica
      publication.publications = publication.publications.filter(p => p.locale !== locale);
      publication.updatedAt = new Date();

      const updatedPublication = await this.repository.update(_id, publication);

      if (!updatedPublication) {
        throw new Error(`Failed to delete locale ${locale} from publication ${_id}`);
      }

      // Obtener publicación actualizada para devolver idiomas restantes
      const refreshedPublication = await this.getById(_id);
      const remainingLocales = refreshedPublication.publications.map(p => p.locale);

      return {
        message: `Locale '${locale}' deleted successfully`,
        deletedLocale: locale,
        remainingLocales
      };
    } catch (error) {
      throw new Error(`Error deleting locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ENDPOINT 4: Cambiar estado por idioma específico
   */
  async updateStatusByLocale(_id: string, locale: string, status: 'draft' | 'published'): Promise<{
    locale: string;
    status: string;
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);

      // Verificar que el idioma existe en la publicación
      const translationIndex = publication.publications.findIndex(p => p.locale === locale);
      if (translationIndex === -1) {
        throw new Error(`Locale '${locale}' not found in publication ${_id}`);
      }

      // Validar que el estado es válido
      const validStatuses = ['draft', 'published'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Verificar que la traducción está completa antes de publicar
      const translation = publication.publications[translationIndex];
      if (status === 'published') {
        if (!translation.title || !translation.slug || !translation.body) {
          throw new Error(`Cannot publish incomplete translation for locale '${locale}'`);
        }
      }

      // Actualizar el estado específico del idioma
      publication.publications[translationIndex].status = status;
      publication.updatedAt = new Date();

      const updatedPublication = await this.repository.update(_id, publication);

      if (!updatedPublication) {
        throw new Error(`Failed to update status for locale ${locale} in publication ${_id}`);
      }

      return {
        locale,
        status,
        lastModified: new Date(),
        message: `Status updated to '${status}' for locale '${locale}'`
      };
    } catch (error) {
      throw new Error(`Error updating status by locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Método auxiliar para generar sugerencias de slug
  private generateSlugSuggestions(baseSlug: string): string[] {
    const currentYear = new Date().getFullYear();
    return [
      `${baseSlug}-${currentYear}`,
      `${baseSlug}-nuevo`,
      `${baseSlug}-actualizado`,
      `${baseSlug}-2`,
      `${baseSlug}-v2`
    ];
  }

  // NUEVOS MÉTODOS ESPECIALIZADOS PARA ENDPOINTS PATCH

  /**
   * Actualizar estado global de la publicación
   * PATCH /api/publication/:_id/global-status
   */
  async updateGlobalStatus(_id: string, status: 'draft' | 'published' | 'archived'): Promise<{
    _id: string;
    previousStatus: string;
    newStatus: string;
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      const previousStatus = publication.status;

      // Si se cambia a 'published', validar que al menos una traducción esté publicada
      if (status === 'published') {
        const hasPublishedTranslation = publication.publications.some(p => p.status === 'published');
        if (!hasPublishedTranslation) {
          throw new Error('No se puede cambiar el estado global a "published" sin al menos una traducción publicada');
        }
      }

      // Si se cambia a 'archived', cambiar todas las traducciones a draft
      let updatedPublications = publication.publications;
      if (status === 'archived') {
        updatedPublications = publication.publications.map(p => ({
          ...p,
          status: 'draft' as const
        }));
      }

      // Actualizar el estado global
      const updatedPublication = await this.repository.update(_id, {
        status,
        publications: updatedPublications,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update global status for publication ${_id}`);
      }

      return {
        _id,
        previousStatus,
        newStatus: status,
        lastModified: new Date(),
        message: `Estado global actualizado de '${previousStatus}' a '${status}'`
      };
    } catch (error) {
      throw new Error(`Error updating global status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar tipo de publicación
   * PATCH /api/publication/:_id/type
   */
  async updatePublicationType(_id: string, type: typeof CMS_SUPPORTED_PUBLICATION_TYPES[number]): Promise<{
    _id: string;
    previousType: string;
    newType: string;
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      const previousType = publication.type;

      // Actualizar el tipo
      const updatedPublication = await this.repository.update(_id, {
        type,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update type for publication ${_id}`);
      }

      return {
        _id,
        previousType,
        newType: type,
        lastModified: new Date(),
        message: `Tipo de publicación actualizado de '${previousType}' a '${type}'`
      };
    } catch (error) {
      throw new Error(`Error updating publication type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar categorías de la publicación
   * PATCH /api/publication/:_id/categories
   */
  async updateCategories(_id: string, categoryIds: string[]): Promise<{
    _id: string;
    previousCategories: string[];
    newCategories: string[];
    categoriesAdded: string[];
    categoriesRemoved: string[];
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      const previousCategories = publication.category_ids?.map(id => id.toString()) || [];

      // Calcular cambios
      const categoriesAdded = categoryIds.filter(id => !previousCategories.includes(id));
      const categoriesRemoved = previousCategories.filter(id => !categoryIds.includes(id));

      // Actualizar las categorías
      const updatedPublication = await this.repository.update(_id, {
        category_ids: categoryIds,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update categories for publication ${_id}`);
      }

      return {
        _id,
        previousCategories,
        newCategories: categoryIds,
        categoriesAdded,
        categoriesRemoved,
        lastModified: new Date(),
        message: `Categorías actualizadas: ${categoriesAdded.length} añadidas, ${categoriesRemoved.length} eliminadas`
      };
    } catch (error) {
      throw new Error(`Error updating categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar tags de la publicación
   * PATCH /api/publication/:_id/tags
   */
  async updateTags(_id: string, tagIds: string[]): Promise<{
    _id: string;
    previousTags: string[];
    newTags: string[];
    tagsAdded: string[];
    tagsRemoved: string[];
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      const previousTags = publication.tag_ids?.map(id => id.toString()) || [];

      // Calcular cambios
      const tagsAdded = tagIds.filter(id => !previousTags.includes(id));
      const tagsRemoved = previousTags.filter(id => !tagIds.includes(id));

      // Actualizar los tags
      const updatedPublication = await this.repository.update(_id, {
        tag_ids: tagIds,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update tags for publication ${_id}`);
      }

      return {
        _id,
        previousTags,
        newTags: tagIds,
        tagsAdded,
        tagsRemoved,
        lastModified: new Date(),
        message: `Tags actualizados: ${tagsAdded.length} añadidos, ${tagsRemoved.length} eliminados`
      };
    } catch (error) {
      throw new Error(`Error updating tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar imagen destacada de la publicación
   * PATCH /api/publication/:_id/featured-image
   */
  async updateFeaturedImage(_id: string, mediaId: string | null | undefined): Promise<{
    _id: string;
    previousFeaturedImage: string | null;
    newFeaturedImage: string | null;
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      
      // Almacenar el valor anterior
      const previousFeaturedImage = publication.media_id?.toString() || null;

      // Preparar el valor para actualizar (undefined se convierte en null para eliminar)
      const newMediaId = mediaId === undefined ? null : mediaId;

      // Actualizar la publicación
      const updatedPublication = await this.repository.update(_id, {
        media_id: newMediaId,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update featured image for publication ${_id}`);
      }

      return {
        _id,
        previousFeaturedImage,
        newFeaturedImage: newMediaId,
        lastModified: new Date(),
        message: newMediaId 
          ? 'Imagen destacada actualizada correctamente'
          : 'Imagen destacada eliminada correctamente'
      };
    } catch (error) {
      throw new Error(`Error updating featured image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar galería de imágenes de la publicación
   * PATCH /api/publication/:_id/gallery
   */
  async updateGallery(_id: string, mediaIds: string[]): Promise<{
    _id: string;
    previousGallery: string[];
    newGallery: string[];
    imagesAdded: string[];
    imagesRemoved: string[];
    lastModified: Date;
    message: string;
  }> {
    try {
      // Verificar que la publicación existe
      const publication = await this.getById(_id);
      
      // Almacenar los valores anteriores
      const previousGallery = publication.media_ids?.map(id => id.toString()) || [];

      // Calcular diferencias
      const imagesAdded = mediaIds.filter(id => !previousGallery.includes(id));
      const imagesRemoved = previousGallery.filter(id => !mediaIds.includes(id));

      // Actualizar la publicación
      const updatedPublication = await this.repository.update(_id, {
        media_ids: mediaIds,
        updatedAt: new Date()
      });

      if (!updatedPublication) {
        throw new Error(`Failed to update gallery for publication ${_id}`);
      }

      return {
        _id,
        previousGallery,
        newGallery: mediaIds,
        imagesAdded,
        imagesRemoved,
        lastModified: new Date(),
        message: `Galería actualizada correctamente. ${imagesAdded.length} imágenes agregadas, ${imagesRemoved.length} imágenes eliminadas`
      };
    } catch (error) {
      throw new Error(`Error updating gallery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 