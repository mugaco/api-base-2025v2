import { z } from 'zod';

// Tipos de medios permitidos
const MediaTypeEnum = z.enum(['image', 'video', 'document', 'audio', 'other']);

// Esquema base para Media
export const MediaBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  filename: z.string().min(1, 'El nombre del archivo es obligatorio'),
  originalFilename: z.string().min(1, 'El nombre original del archivo es obligatorio'),
  type: MediaTypeEnum,
  mimeType: z.string().min(1, 'El tipo MIME es obligatorio'),
  size: z.number().min(0, 'El tamaño debe ser un número positivo'),
  storage: z.record(z.any()), // Record<string, any>
  library_id: z.any(), // ObjectId
  library_name: z.string().min(1, 'El nombre de la biblioteca es obligatorio'),
  library_slug: z.string().min(1, 'El slug de la biblioteca es obligatorio'),
  folder_id: z.any().optional(), // ObjectId opcional
  metadata: z.record(z.any()).optional(),
  tag_ids: z.array(z.string()).optional(),
  user_id: z.any().optional(), // ObjectId opcional
  variants: z.array(z.record(z.any())).optional(),
  
  isDeleted: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Tipo base para Media
export type IMediaBase = z.infer<typeof MediaBaseSchema>;

// Esquema para creación de Media
export const CreateMediaSchema = MediaBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true, isDeleted: true });

export type ICreateMedia = z.infer<typeof CreateMediaSchema>;

// Esquema para actualización de Media (todos los campos opcionales)
export const UpdateMediaSchema = MediaBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true, isDeleted: true });

export type IUpdateMedia = z.infer<typeof UpdateMediaSchema>;

// Esquema para respuestas (sin campos sensibles)
export const MediaResponseSchema = MediaBaseSchema
  .omit({ isDeleted: true });

export type IMediaResponse = z.infer<typeof MediaResponseSchema>;

// Función auxiliar para convertir Media a MediaResponse
export const mediaToResponse = (media: unknown): IMediaResponse => {
  // Convertir documento Mongoose a objeto plano si es necesario
  const mediaObj = (media && typeof (media as Record<string, unknown>).toObject === 'function')
    ? (media as { toObject: () => Record<string, unknown> }).toObject()
    : ((media && typeof (media as Record<string, unknown>).toJSON === 'function')
        ? (media as { toJSON: () => Record<string, unknown> }).toJSON()
        : media) as Record<string, unknown>;
  
  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (mediaObj?._id) {
    _id = typeof (mediaObj._id as { toString?: () => string }).toString === 'function'
      ? (mediaObj._id as { toString: () => string }).toString()
      : String(mediaObj._id);
  }
  
  // Asegurar que library_id sea string
  let library_id = '';
  if (mediaObj?.library_id) {
    library_id = typeof (mediaObj.library_id as { toString?: () => string }).toString === 'function'
      ? (mediaObj.library_id as { toString: () => string }).toString()
      : String(mediaObj.library_id);
  }
  
  // Asegurar que folder_id sea string si existe
  let folder_id = undefined;
  if (mediaObj?.folder_id) {
    folder_id = typeof (mediaObj.folder_id as { toString?: () => string }).toString === 'function'
      ? (mediaObj.folder_id as { toString: () => string }).toString()
      : String(mediaObj.folder_id);
  }
  
  // Asegurar que user_id sea string si existe
  let user_id = undefined;
  if (mediaObj?.user_id) {
    user_id = typeof (mediaObj.user_id as { toString?: () => string }).toString === 'function'
      ? (mediaObj.user_id as { toString: () => string }).toString()
      : String(mediaObj.user_id);
  }
  
  return {
    _id,
    filename: (mediaObj?.filename as string) || '',
    originalFilename: (mediaObj?.originalFilename as string) || '',
    type: (mediaObj?.type as 'image' | 'video' | 'document' | 'audio' | 'other') || 'other',
    mimeType: (mediaObj?.mimeType as string) || '',
    size: (mediaObj?.size as number) || 0,
    storage: (mediaObj?.storage as Record<string, unknown>) || {},
    library_id,
    library_name: (mediaObj?.library_name as string) || '',
    library_slug: (mediaObj?.library_slug as string) || '',
    folder_id,
    metadata: (mediaObj?.metadata as Record<string, unknown>) || undefined,
    tag_ids: (mediaObj?.tag_ids as string[]) || [],
    user_id,
    variants: (mediaObj?.variants as Record<string, unknown>[]) || [],
    createdAt: (mediaObj?.createdAt as Date) || new Date(),
    updatedAt: (mediaObj?.updatedAt as Date) || new Date()
  };
}; 