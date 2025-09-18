import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ImageTransformationOptions, ProcessedImage, ImageTransformationServiceInterface } from './ImageTransformation.interface';
import { defaultThumbnailConfigs } from './thumbnailsConfig';

/**
 * Errores específicos del servicio de transformación de imágenes
 */
export class ImageTransformationError extends Error {
  constructor(message: string, public code: string, public originalError?: Error) {
    super(message);
    this.name = 'ImageTransformationError';
  }
}

/**
 * Servicio para transformar imágenes en múltiples variantes (thumbnails)
 */
export class ImageTransformationService implements ImageTransformationServiceInterface {
  /**
   * Obtiene la configuración predeterminada de variantes para thumbnails
   * @returns Configuración de variantes por defecto
   */
  getDefaultVariants(): ImageTransformationOptions['variants'] {
    return defaultThumbnailConfigs.image;
  }

  /**
   * Transforma una imagen en múltiples variantes según la configuración
   * Respeta la relación de aspecto original y nunca amplía imágenes más allá de su tamaño original
   * @param file Objeto de archivo de imagen (de Multer)
   * @param options Opciones de transformación
   * @returns Array de imágenes procesadas
   * @throws {ImageTransformationError} Si ocurre un error durante la transformación
   */
  async transformImage(file: Express.Multer.File, options: ImageTransformationOptions): Promise<ProcessedImage[]> {
    try {
      // Validar entrada
      if (!file || !file.buffer) {
        throw new ImageTransformationError(
          'Se requiere un archivo con buffer',
          'MISSING_BUFFER'
        );
      }

      if (!options || !options.variants || !Array.isArray(options.variants) || options.variants.length === 0) {
        throw new ImageTransformationError(
          'Se requiere al menos una variante en las opciones',
          'INVALID_OPTIONS'
        );
      }

      const result: ProcessedImage[] = [];

      // Obtener información de la imagen original
      let metadata;
      try {
        metadata = await sharp(file.buffer).metadata();
      } catch (error) {
        throw new ImageTransformationError(
          'Error al analizar la imagen original: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          'METADATA_ERROR',
          error instanceof Error ? error : undefined
        );
      }

      // Añadir la imagen original si se solicita
      if (options.keepOriginal !== false) {
        result.push({
          ...file,
          fileType: 'image',
          _id: uuidv4(),
          variant: 'original',
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown'
        });
      }

      // Procesar todas las variantes en paralelo
      const variantPromises = options.variants.map(async (variant) => {
        try {
          const transformer = sharp(file.buffer);

          // Aplicar redimensionamiento manteniendo ratio y sin ampliar
          if (variant.width || variant.height) {
            transformer.resize({
              width: variant.width,
              height: variant.height,
              fit: variant.fit as keyof sharp.FitEnum || 'inside', // 'inside' mantiene la proporción
              withoutEnlargement: true // Evita crear thumbnails más grandes que el original
            });
          }

          // Establecer formato
          const format = variant.format || options.defaultFormat || metadata.format || 'jpeg';
          transformer.toFormat(format as keyof sharp.FormatEnum, {
            quality: variant.quality
          });

          // Generar el buffer
          const buffer = await transformer.toBuffer();

          // Obtener dimensiones finales
          const newMetadata = await sharp(buffer).metadata();

          // Crear objeto para esta variante
          return {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: `image/${format}`,
            fileType: 'image',
            _id: uuidv4(), // Generar nuevo ID para cada variante
            buffer,
            size: buffer.length,
            variant: variant.name,
            width: newMetadata.width || 0,
            height: newMetadata.height || 0,
            format
          } as ProcessedImage;
        } catch (error) {
          // Capturar errores específicos por variante
          throw new ImageTransformationError(
            `Error al procesar la variante "${variant.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`,
            'VARIANT_PROCESSING_ERROR',
            error instanceof Error ? error : undefined
          );
        }
      });

      // Esperar que todas las variantes se procesen y añadirlas al resultado
      try {
        const processedVariants = await Promise.all(variantPromises);
        result.push(...processedVariants);
      } catch (error) {
        // Propagar el error de procesamiento de variantes
        throw error instanceof ImageTransformationError ?
          error :
          new ImageTransformationError(
            'Error al procesar las variantes: ' + (error instanceof Error ? error.message : 'Error desconocido'),
            'PROCESSING_ERROR',
            error instanceof Error ? error : undefined
          );
      }

      return result;
    } catch (error) {
      // Manejar errores específicos
      // Sharp no expone directamente sus tipos de error de manera fácil
      // así que verificamos si es un error relacionado con Sharp por el mensaje
      if (error instanceof Error &&
        error.message &&
        (error.message.includes('sharp') || error.message.includes('libvips'))) {
        throw new ImageTransformationError(
          `Error de procesamiento de imagen: ${error.message}`,
          'IMAGE_PROCESSING_ERROR',
          error
        );
      }

      // Propagar ImageTransformationError o convertir otros errores
      throw error instanceof ImageTransformationError ?
        error :
        new ImageTransformationError(
          'Error inesperado durante la transformación: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          'UNEXPECTED_ERROR',
          error instanceof Error ? error : undefined
        );
    }
  }

  /**
   * Obtiene información básica sobre una imagen sin procesarla
   * @param buffer Buffer de la imagen
   * @returns Metadata básica de la imagen
   * @throws {ImageTransformationError} Si ocurre un error al analizar la imagen
   */
  async getImageInfo(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      throw new ImageTransformationError(
        'Error al obtener información de la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        'METADATA_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }
} 