/**
 * Controlador para la configuración del CMS
 *
 * Expone endpoints para que el frontend pueda acceder a la configuración
 * de idiomas y otras configuraciones del CMS.
 */

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@core/base/BaseController';
import {
  CMS_CONFIG,
  getEnabledLocales,
  getDefaultLocale,
  CMS_SUPPORTED_LOCALES,
  CMS_DEFAULT_LOCALE,
  getLocaleConfig,
  getEnabledPublicationTypes,
  CMS_SUPPORTED_PUBLICATION_TYPES,
  CMS_DEFAULT_PUBLICATION_TYPE,
  getPublicationTypeConfig
} from '@packages/cms/config/cms.config';

/**
 * Controlador de configuración que hereda de BaseController
 * No requiere servicio ya que solo maneja configuración estática
 */
export class CMSConfigController extends BaseController<never> {
  constructor() {
    // Pasamos null como servicio ya que este controlador no necesita uno
    super(null as never);
  }

  /**
   * Método requerido por BaseController pero no usado en este caso
   */
  protected buildQuery(_req: Request): Record<string, unknown> {
    return {};
  }
  
  /**
   * Obtiene la configuración completa del CMS
   */
  getFullConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.sendSuccessResponse(res, CMS_CONFIG);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo la configuración de idiomas
   */
  getLocalesConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const localesConfig = {
        supportedLocales: CMS_SUPPORTED_LOCALES,
        defaultLocale: CMS_DEFAULT_LOCALE,
        enabledLocales: getEnabledLocales(),
        defaultLocaleInfo: getDefaultLocale()
      };

      this.sendSuccessResponse(res, localesConfig);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información de un idioma específico
   */
  getLocaleInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { localeCode } = req.params;
      const localeInfo = getLocaleConfig(localeCode);
      
      if (!localeInfo) {
        return this.sendErrorResponse(
          res,
          `Idioma '${localeCode}' no encontrado`,
          404
        );
      }

      this.sendSuccessResponse(res, localeInfo);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los códigos de idiomas soportados (endpoint simple)
   */
  getSupportedLocales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.sendSuccessResponse(res, {
        supportedLocales: CMS_SUPPORTED_LOCALES,
        defaultLocale: CMS_DEFAULT_LOCALE
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información de los tipos de publicación
   */
  getPublicationTypesConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const publicationTypesConfig = {
        supportedTypes: CMS_SUPPORTED_PUBLICATION_TYPES,
        defaultType: CMS_DEFAULT_PUBLICATION_TYPE,
        enabledTypes: getEnabledPublicationTypes()
      };
      
      this.sendSuccessResponse(res, publicationTypesConfig);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información de un tipo de publicación específico
   */
  getPublicationTypeInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { typeKey } = req.params;
      const typeInfo = getPublicationTypeConfig(typeKey);
      
      if (!typeInfo) {
        return this.sendErrorResponse(
          res,
          `Tipo de publicación '${typeKey}' no encontrado`,
          404
        );
      }

      this.sendSuccessResponse(res, typeInfo);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint de salud para verificar la configuración del CMS
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = {
        status: 'ok',
        features: CMS_CONFIG.features,
        localesCount: getEnabledLocales().length,
        defaultLocale: CMS_DEFAULT_LOCALE,
        publicationTypesCount: getEnabledPublicationTypes().length,
        defaultPublicationType: CMS_DEFAULT_PUBLICATION_TYPE,
        timestamp: new Date().toISOString()
      };
      
      this.sendSuccessResponse(res, health);
    } catch (error) {
      next(error);
    }
  };
} 