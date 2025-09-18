import { Request, Response, NextFunction } from 'express';
import { CategoryFlattener, CMSTranslationFlattener, normalizeLocale } from '@packages/cms/utils';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

/**
 * Middleware para aplanar respuestas de Category en endpoints específicos
 * Solo aplana en rutas / y /:_id usando el sistema CMS de aplanado
 */
export const aplanaCategoryMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Interceptar el método json para aplanar la respuesta
    const originalJson = res.json;
    res.json = function (body: unknown): Response {

        const logger = Container.resolve<ILoggerService>('loggerService');

        // Extraer idioma del request SIN fallback automático
        const rawLocale = CMSTranslationFlattener.extractLocaleFromRequest(req as never);
        const locale = rawLocale ? normalizeLocale(rawLocale) : null;

        logger.info('[Category] Locale detectado', { rawLocale, locale });

        // Solo aplanar si tenemos un locale válido
        if (!locale) {
            logger.warn('[Category] No se detectó locale válido, devolviendo respuesta sin aplanar');
            return originalJson.call(this, body);
        }

        let transformedBody = { ...(body as Record<string, unknown>) };
        let transformedData = transformedBody.data;
        
        if (Array.isArray(transformedData)) {
            transformedData = (transformedData as unknown[]).map((item: unknown) => {
                const typedItem = item as Record<string, unknown> & { toJSON?: () => unknown; categories?: unknown[] };
                // Verificar que el item tenga categories
                if (typedItem.categories && Array.isArray(typedItem.categories)) {
                    // Convertir documento Mongoose a objeto plano aplicando transform toJSON
                    const plainItem = typedItem.toJSON ? typedItem.toJSON() : item;
                    // Pasar el item completo al flattener
                    const plano = CategoryFlattener.flatten(plainItem as never, locale);
                    return plano;
                }
                // Si no tiene categories, retornar el item como objeto plano con transform
                return typedItem.toJSON ? typedItem.toJSON() : item;
            });
        } else if (transformedData && (transformedData as Record<string, unknown>).categories) {
            // Si es un solo elemento (no array) pero tiene categories
            const typedData = transformedData as Record<string, unknown> & { toJSON?: () => unknown };
            const plainData = typedData.toJSON ? typedData.toJSON() : transformedData;
            transformedData = CategoryFlattener.flatten(plainData as never, locale);
        }
        
        transformedBody.data = transformedData;
        logger.debug('[Category] Body aplanado', { transformedBody });

        return originalJson.call(this, transformedBody);
    };

    next();
}; 