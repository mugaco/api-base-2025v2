/**
 * Configuraciones predeterminadas para la generación de thumbnails
 */
export const defaultThumbnailConfigs = {
  /**
   * Configuración estándar para imágenes generales
   */
  image: [
    { name: 'thumb_sm', width: 150, height: 150, format: 'webp', quality: 80 },
    { name: 'thumb_md', width: 300, height: 300, format: 'webp', quality: 80 },
    { name: 'thumb_lg', width: 600, format: 'webp', quality: 85 }
  ],
  
  /**
   * Configuración optimizada para avatares (recorte tipo "cover")
   */
  avatar: [
    { name: 'thumb_sm', width: 48, height: 48, fit: 'cover', format: 'webp', quality: 80 },
    { name: 'thumb_md', width: 96, height: 96, fit: 'cover', format: 'webp', quality: 80 }
  ],
  
  /**
   * Configuración para banners (recorte tipo "cover")
   */
  banner: [
    { name: 'mobile', width: 640, height: 320, fit: 'cover', format: 'webp', quality: 85 },
    { name: 'desktop', width: 1200, height: 400, fit: 'cover', format: 'webp', quality: 85 }
  ]
}; 