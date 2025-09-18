import { Request, Response, NextFunction } from 'express';
import { 
  CMS_DEFAULT_LOCALE, 
  CMS_SUPPORTED_LOCALES, 
  CMS_DEFAULT_PUBLICATION_TYPE,
} from '@packages/cms/config/cms.config';

/**
 * Genera un slug a partir de un título
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios por guiones
    .replace(/-+/g, '-'); // Eliminar guiones duplicados
}

/**
 * Trunca un texto a un máximo de caracteres sin cortar palabras
 */
function truncateMetaTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) {
    return title;
  }
  
  // Buscar el último espacio antes del límite
  const truncated = title.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // Si hay espacios, cortar en el último espacio
  // Si no hay espacios, cortar exactamente en el límite
  return lastSpaceIndex > 0 
    ? truncated.substring(0, lastSpaceIndex)
    : truncated;
}

/**
 * Middleware para preparar el objeto de publicación
 * 
 * Toma un payload mínimo con title y type (ya validado por Zod),
 * y prepara un objeto completo con traducciones para todos los idiomas configurados
 */
export const preparePublicationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { title, type } = req.body;

    // En este punto, title y type ya fueron validados por Zod
    // Preparar las traducciones para todos los idiomas
    const publications = CMS_SUPPORTED_LOCALES.map(locale => {
      // Para el idioma por defecto, usar el título original
      // Para otros idiomas, añadir el sufijo del locale
      const localizedTitle = locale === CMS_DEFAULT_LOCALE 
        ? title 
        : `${title}-${locale}`;

      return {
        locale,
        title: localizedTitle,
        slug: generateSlug(localizedTitle),
        body: `# ${localizedTitle}\n\nContenido pendiente...`, // Contenido por defecto para borradores
        status: 'draft' as const,
        excerpt: "Contenido pendiente...",
        seo: {
          meta_title: truncateMetaTitle(localizedTitle),
          meta_description: "Contenido pendiente...",
          keywords: []
        }
      };
    });

    // Preparar el objeto completo de publicación
    const preparedPublication = {
      default_locale: CMS_DEFAULT_LOCALE,
      type: type || CMS_DEFAULT_PUBLICATION_TYPE, // Usar el tipo por defecto si no se especifica
      status: 'draft' as const,
      format: 'markdown' as const,
      user_id: req.context?.user?._id || req.body.user_id, // Usar el usuario de la sesión o del body
      publications
    };

    // Reemplazar el body con el objeto preparado
    req.body = preparedPublication;

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Error al preparar la publicación',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 