import { z } from 'zod';

// Esquema base para LibraryTag
export const LibraryTagBaseSchema = z.object({
  _id: z.unknown().optional(), // Usando unknown para permitir compatibilidad con ObjectId
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

// Tipo base para LibraryTag
export type ILibraryTagBase = z.infer<typeof LibraryTagBaseSchema>;

// Esquema para creación de LibraryTag
export const CreateLibraryTagSchema = LibraryTagBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no debe exceder 100 caracteres'),
    color: z.string().min(1, 'El color es obligatorio')
  });

export type ICreateLibraryTag = z.infer<typeof CreateLibraryTagSchema>;

// Esquema para actualización de LibraryTag (todos los campos opcionales)
export const UpdateLibraryTagSchema = LibraryTagBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateLibraryTag = z.infer<typeof UpdateLibraryTagSchema>;

// Esquema para respuestas (sin campos sensibles)
export const LibraryTagResponseSchema = LibraryTagBaseSchema
  .omit({ isDeleted: true });

export type ILibraryTagResponse = z.infer<typeof LibraryTagResponseSchema>;

// Función auxiliar para convertir LibraryTag a LibraryTagResponse
export const libraryTagToResponse = (libraryTag: unknown): ILibraryTagResponse => {
  // Convertir documento Mongoose a objeto plano si es necesario
  const libraryTagObj = libraryTag && typeof (libraryTag as Record<string, unknown>).toObject === 'function'
    ? (libraryTag as Record<string, unknown> & { toObject: () => Record<string, unknown> }).toObject()
    : (libraryTag && typeof (libraryTag as Record<string, unknown>).toJSON === 'function' ? (libraryTag as Record<string, unknown> & { toJSON: () => Record<string, unknown> }).toJSON() : libraryTag);

  // Convertir a objeto tipado para acceso a propiedades
  const typedObj = libraryTagObj as Record<string, unknown>;

  // Manejar ID de MongoDB apropiadamente
  let _id = '';
  if (typedObj?._id) {
    _id = typeof (typedObj._id as Record<string, unknown>).toString === 'function'
      ? (typedObj._id as Record<string, unknown> & { toString: () => string }).toString()
      : String(typedObj._id);
  }

  return {
    _id,
    name: (typedObj?.name as string) || '',
    slug: (typedObj?.name as string) || '',
    description: (typedObj?.description as string) || undefined,
    color: (typedObj?.color as string) || '',
    icon: (typedObj?.icon as string) || undefined,
    createdAt: (typedObj?.createdAt as Date) || new Date(),
    updatedAt: (typedObj?.updatedAt as Date) || new Date()
  };
}; 