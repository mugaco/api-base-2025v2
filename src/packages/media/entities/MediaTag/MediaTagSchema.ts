import { z } from 'zod';

// Esquema base para MediaTag
export const MediaTagBaseSchema = z.object({
  _id: z.unknown().optional(), // Compatible con ObjectId
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no debe exceder 100 caracteres'),
  slug: z.string(),
  description: z.string().optional(),
  color: z.string().min(1, 'El color es obligatorio'),
  icon: z.string().optional(),
  isDeleted: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Tipo base para MediaTag
export type IMediaTagBase = z.infer<typeof MediaTagBaseSchema>;

// Esquema para creación de MediaTag
export const CreateMediaTagSchema = MediaTagBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true, isDeleted: true })
  .extend({
    name: z.string()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no debe exceder 100 caracteres'),
    color: z.string().min(1, 'El color es obligatorio')
  });

export type ICreateMediaTag = z.infer<typeof CreateMediaTagSchema>;

// Esquema para actualización de MediaTag (todos los campos opcionales)
export const UpdateMediaTagSchema = MediaTagBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true, isDeleted: true });

export type IUpdateMediaTag = z.infer<typeof UpdateMediaTagSchema>;

// Esquema para respuestas (sin campos sensibles)
export const MediaTagResponseSchema = MediaTagBaseSchema
  .omit({ isDeleted: true });

export type IMediaTagResponse = z.infer<typeof MediaTagResponseSchema>;

// Función auxiliar para convertir MediaTag a MediaTagResponse
export const mediaTagToResponse = (mediaTag: Record<string, unknown> & { toObject?: () => Record<string, unknown>; toJSON?: () => Record<string, unknown> }): IMediaTagResponse => {
  // Convertir documento Mongoose a objeto plano si es necesario
  const mediaTagObj = mediaTag && typeof mediaTag.toObject === 'function'
    ? mediaTag.toObject()
    : (mediaTag && typeof mediaTag.toJSON === 'function' ? mediaTag.toJSON() : mediaTag);

  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (mediaTagObj?._id) {
    _id = typeof mediaTagObj._id.toString === 'function'
      ? mediaTagObj._id.toString()
      : String(mediaTagObj._id);
  }

  return {
    _id,
    name: (mediaTagObj?.name as string) || '',
    slug: (mediaTagObj?.slug as string) || '',
    description: (mediaTagObj?.description as string) || undefined,
    color: (mediaTagObj?.color as string) || '',
    icon: (mediaTagObj?.icon as string) || undefined,
    createdAt: (mediaTagObj?.createdAt as Date) || new Date(),
    updatedAt: (mediaTagObj?.updatedAt as Date) || new Date()
  };
}; 