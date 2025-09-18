import { Request, Response, NextFunction } from 'express';
import { PublicationFlattener, CMSTranslationFlattener, normalizeLocale } from '@packages/cms/utils';

/**
 * Middleware para aplanar respuestas de Publication en endpoints específicos
 * Solo aplana en rutas / y /:_id usando el sistema CMS de aplanado
 */
export const aplanaPublicationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    
    /**
     * Determina qué locale usar basándose en el status de la traducción
     * @param plainItem - El item con las publications
     * @param requestedLocale - El locale solicitado originalmente
     * @returns El locale apropiado a usar
     */
    const determineLocaleToUse = (plainItem: Record<string, unknown>, requestedLocale: string): string => {
        // Buscar si existe traducción para el locale solicitado
        const publications = plainItem.publications as Array<{ locale: string; status: string }>;
        const translation = publications.find((pub) => pub.locale === requestedLocale);
        
        if (translation && translation.status === 'draft') {
            // Si la traducción existe pero está en draft, usar el locale por defecto
            // console.log(`⚠️ Traducción en '${requestedLocale}' está en draft, usando locale por defecto: ${plainItem.default_locale}`);
            return (plainItem.default_locale as string);
        }
        return requestedLocale;
    };

    // Interceptar el método json para aplanar la respuesta
    const originalJson = res.json;
    res.json = function (body: unknown): Response {

        // Extraer idioma del request SIN fallback automático
        const rawLocale = CMSTranslationFlattener.extractLocaleFromRequest(req as never);
        const locale = rawLocale ? normalizeLocale(rawLocale) : null;
        
        // console.log('🌍 Locale raw detectado:', rawLocale);
        // console.log('🌍 Locale normalizado:', locale);

        // Solo aplanar si tenemos un locale válido
        if (!locale) {
            // console.log('⚠️ No se detectó locale válido, devolviendo respuesta sin aplanar');
            return originalJson.call(this, body);
        }

        let transformedBody = { ...(body as Record<string, unknown>) };
        let transformedData = transformedBody.data;
        
        if (Array.isArray(transformedData)) {
            transformedData = (transformedData as unknown[]).map((item: unknown) => {
                const typedItem = item as Record<string, unknown> & { toJSON?: () => unknown; publications?: unknown[] };
                // Verificar que el item tenga publications
                if (typedItem.publications && Array.isArray(typedItem.publications)) {
                    // Convertir documento Mongoose a objeto plano aplicando transform toJSON
                    const plainItem = typedItem.toJSON ? typedItem.toJSON() : item;

                    // Determinar qué locale usar basándose en el status de la traducción
                    const localeToUse = determineLocaleToUse(plainItem as Record<string, unknown>, locale);

                    // Pasar el item completo al flattener con el locale apropiado
                    const plano = PublicationFlattener.flatten(plainItem as never, localeToUse);
                    return plano;
                }
                // Si no tiene publications, retornar el item como objeto plano con transform
                return typedItem.toJSON ? typedItem.toJSON() : item;
            });
        } else if (transformedData && (transformedData as Record<string, unknown>).publications) {
            // Si es un solo elemento (no array) pero tiene publications
            const typedData = transformedData as Record<string, unknown> & { toJSON?: () => unknown };
            const plainData = typedData.toJSON ? typedData.toJSON() : transformedData;

            // Determinar qué locale usar basándose en el status de la traducción
            const localeToUse = determineLocaleToUse(plainData as Record<string, unknown>, locale);

            transformedData = PublicationFlattener.flatten(plainData as never, localeToUse);
        }
        
        transformedBody.data = transformedData;
        // console.log('🔍 Body aplanado:', JSON.stringify(transformedBody, null, 2));

        return originalJson.call(this, transformedBody);
    };

    next();
}; 