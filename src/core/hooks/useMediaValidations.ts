import { mediaTypeConfigs, MediaTypeConfig } from '@packages/media/config/media.config';
import { useBadRequestError } from './useError';

/**
 * Hook para validar el tipo de archivo según los tipos permitidos
 */
export const useMediaTypeValidation = (file: Express.Multer.File, allowedTypes: string[]): { type: string; config: MediaTypeConfig } => {
  // Si no se especifican tipos permitidos, se permiten todos los configurados
  if (allowedTypes.length === 0) {
    allowedTypes = Object.keys(mediaTypeConfigs);
  }

  // Buscar si el mimetype del archivo coincide con alguno de los tipos permitidos
  for (const typeKey of allowedTypes) {
    const config = mediaTypeConfigs[typeKey];
    if (config && config.mimeTypes.includes(file.mimetype)) {
      return { type: config.type, config };
    }
  }

  // Si llegamos aquí, el tipo no está permitido
  const allowedFormats = allowedTypes
    .map(type => mediaTypeConfigs[type]?.mimeTypes.join(', '))
    .filter(Boolean)
    .join(', ');

  throw useBadRequestError(
    `Tipo de archivo no permitido. Formatos aceptados: ${allowedFormats}`,
    'INVALID_FILE_TYPE'
  );
};

/**
 * Hook para validar el tamaño del archivo según su tipo
 */
export const useMediaSizeValidation = (file: Express.Multer.File, mediaType: MediaTypeConfig): void => {
  if (mediaType.maxSize && file.size > mediaType.maxSize) {
    const maxSizeMB = mediaType.maxSize / (1024 * 1024);
    throw useBadRequestError(
      `El archivo excede el tamaño máximo permitido de ${maxSizeMB}MB para archivos de tipo ${mediaType.type}`,
      'FILE_SIZE_LIMIT_EXCEEDED'
    );
  }
};

/**
 * Hook para obtener el tipo de media a partir del mimetype
 */
export const useMediaTypeFromMime = (mimetype: string): MediaTypeConfig['type'] => {
  for (const [, config] of Object.entries(mediaTypeConfigs)) {
    if (config.mimeTypes.includes(mimetype)) {
      return config.type;
    }
  }
  return 'other';
};

/**
 * Hook para validación completa de un archivo
 */
export const useMediaValidation = (file: Express.Multer.File, allowedTypes: string[] = []): string => {
  const { type, config } = useMediaTypeValidation(file, allowedTypes);
  useMediaSizeValidation(file, config);
  return type;
};
