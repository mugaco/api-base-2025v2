import { Buffer } from 'buffer';

/**
 * Opciones para la transformación de imágenes
 */
export interface ImageTransformationOptions {
  /**
   * Configuración de thumbnails a generar
   */
  variants: {
    /** Nombre de la variante (ej: "thumb_sm", "thumb_md") */
    name: string;
    /** Ancho deseado (opcional si se proporciona height) */
    width?: number;
    /** Alto deseado (opcional si se proporciona width) */
    height?: number;
    /** Método de ajuste (cover, contain, fill, etc.) */
    fit?: string;
    /** Formato de salida (webp, jpeg, png, etc.) */
    format?: string;
    /** Calidad de compresión (1-100) */
    quality?: number;
  }[];

  /** Mantener la imagen original en el resultado */
  keepOriginal?: boolean;

  /** Formato por defecto para todas las variantes */
  defaultFormat?: string;
}

/**
 * Resultado de una imagen procesada
 */
export interface ProcessedImage {
  /** Campo del formulario original */
  fieldname: string;
  /** Nombre original del archivo */
  originalname: string;
  /** Codificación original */
  encoding: string;
  /** Tipo MIME (puede cambiar según el formato) */
  mimetype: string;
  /** Tipo de archivo (siempre "image") */
  fileType: string;
  /** ID único para cada variante */
  _id: string;
  /** Buffer conteniendo la imagen procesada */
  buffer: Buffer;
  /** Tamaño del buffer */
  size: number;
  /** "original", "thumb_sm", "thumb_md", etc. */
  variant: string;
  /** Ancho de esta variante */
  width: number;
  /** Alto de esta variante */
  height: number;
  /** Formato de esta variante */
  format: string;
}

/**
 * Interfaz para el servicio de transformación de imágenes
 */
export interface ImageTransformationServiceInterface {
  /**
   * Transforma una imagen en múltiples variantes según la configuración
   * @param file Objeto de archivo de imagen (de Multer)
   * @param options Opciones de transformación
   * @returns Array de imágenes procesadas
   */
  transformImage(file: Express.Multer.File, options: ImageTransformationOptions): Promise<ProcessedImage[]>;

  /**
   * Obtiene la configuración predeterminada de variantes para thumbnails
   * @returns Configuración de variantes por defecto
   */
  getDefaultVariants(): ImageTransformationOptions['variants'];
} 