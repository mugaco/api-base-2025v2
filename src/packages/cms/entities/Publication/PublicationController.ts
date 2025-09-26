/**
 * Controlador para Publication
 */
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import { PublicationService } from './PublicationService';
import {
  IUpdateGlobalStatus,
  IUpdatePublicationType,
  IUpdateCategories,
  IUpdateTags,
  IUpdateFeaturedImage,
  IUpdateGallery
} from './PublicationSchema';

/**
 * Controlador para la entidad Publication heredando de BaseController
 */
export class PublicationController extends BaseController<PublicationService> {
  constructor(publicationService: PublicationService) {
    super(publicationService);
  }

  // MÉTODOS ESPECÍFICOS DE LA ENTIDAD
  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug;
      const locale = req.params.locale;

      const item = await this.service.getBySlug(slug, locale);

      this.sendSuccessResponse(res, item);
    } catch (error) {
      next(error);
    }
  };

  getPublicationMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
      const publication_id = req.params.publication_id;
      const media = await this.service.getPublicationMedia(publication_id);
      this.sendSuccessResponse(res, media);
    } catch (error) {
      next(error);
    }
  }

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchTerm = req.query.term as string;
      if (!searchTerm) {
        return this.sendErrorResponse(res, 'El término de búsqueda es requerido', 400);
      }

      const paginationParams = this.extractPaginationParams(req);
      const options = this.extractQueryOptions(req);

      const result = await this.service.search(searchTerm, paginationParams, options);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  // NUEVOS ENDPOINTS CRÍTICOS PARA GESTIÓN POR IDIOMA

  /**
   * ENDPOINT 6: Validar slug único por idioma
   * GET /api/publication/validate/slug/:slug?locale=:locale&exclude=:id
   */
  validateSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug;
      const locale = req.query.locale as string;
      const excludeId = req.query.publication_id as string;

      if (!locale) {
        return this.sendErrorResponse(res, 'El parámetro locale es requerido', 400);
      }

      const result = await this.service.validateSlug(slug, locale, excludeId);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ENDPOINT 2: Actualizar contenido por idioma específico
   * PUT /api/publication/:_id/locale/:locale
   */
  updateByLocale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const locale = req.params.locale;
      const localeData = req.body;

      const updatedItem = await this.service.updateByLocale(_id, locale, localeData);

      this.sendSuccessResponse(res, updatedItem);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ENDPOINT 2b: Crear nueva traducción basada en idioma default
   * PUT /api/publication/:_id/create-locale/:locale
   */
  createByLocale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const locale = req.params.locale;

      const createdItem = await this.service.createByLocale(_id, locale);

      this.sendSuccessResponse(res, createdItem, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ENDPOINT 3: Eliminar idioma específico
   * DELETE /api/publication/:_id/locale/:locale
   */
  deleteByLocale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const locale = req.params.locale;

      const result = await this.service.deleteByLocale(_id, locale);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ENDPOINT 4: Cambiar estado por idioma específico
   * PATCH /api/publication/:_id/locale/:locale/status
   */
  updateStatusByLocale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const locale = req.params.locale;
      const { status } = req.body;

      if (!status) {
        return this.sendErrorResponse(res, 'El campo status es requerido', 400);
      }

      const updatedItem = await this.service.updateStatusByLocale(_id, locale, status);

      this.sendSuccessResponse(res, updatedItem);
    } catch (error) {
      next(error);
    }
  };

  // NUEVOS ENDPOINTS ESPECIALIZADOS PATCH

  /**
   * Actualizar estado global de la publicación
   * PATCH /api/publication/:_id/global-status
   */
  updateGlobalStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { status } = req.body as IUpdateGlobalStatus;

      const result = await this.service.updateGlobalStatus(_id, status);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar tipo de publicación
   * PATCH /api/publication/:_id/type
   */
  updatePublicationType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { type } = req.body as IUpdatePublicationType;

      const result = await this.service.updatePublicationType(_id, type);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar categorías de la publicación
   * PATCH /api/publication/:_id/categories
   */
  updateCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { category_ids } = req.body as IUpdateCategories;

      const result = await this.service.updateCategories(_id, category_ids);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar tags de la publicación
   * PATCH /api/publication/:_id/tags
   */
  updateTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { tag_ids } = req.body as IUpdateTags;

      const result = await this.service.updateTags(_id, tag_ids);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar imagen destacada de la publicación
   * PATCH /api/publication/:_id/featured-image
   */
  updateFeaturedImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { media_id } = req.body as IUpdateFeaturedImage;

      const result = await this.service.updateFeaturedImage(_id, media_id);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar galería de imágenes de la publicación
   * PATCH /api/publication/:_id/gallery
   */
  updateGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const _id = req.params._id;
      const { media_ids } = req.body as IUpdateGallery;

      const result = await this.service.updateGallery(_id, media_ids);

      this.sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

} 