export interface MediaTypeConfig {
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  mimeTypes: string[];
  maxSize?: number; // Tamaño máximo específico para este tipo en bytes
}
export const mediaTypeConfigs: Record<string, MediaTypeConfig> = {
  image: {
    type: 'image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024 // 5MB para imágenes
  },
  video: {
    type: 'video',
    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    maxSize: 50 * 1024 * 1024 // 50MB para videos
  },
  document: {
    type: 'document',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.text', // ODT (OpenDocument Text)
      'application/vnd.oasis.opendocument.spreadsheet', // ODS (OpenDocument Spreadsheet)
      'application/vnd.oasis.opendocument.presentation', // ODP (OpenDocument Presentation)
      'application/vnd.oasis.opendocument.graphics', // ODG (OpenDocument Graphics)
      'text/markdown',
      'text/plain'
    ],
    maxSize: 10 * 1024 * 1024 // 10MB para documentos
  },
  audio: {
    type: 'audio',
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    maxSize: 10 * 1024 * 1024 // 10MB para audio
  }
};
