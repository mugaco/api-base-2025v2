import { z } from 'zod';

// Esquema para las carpetas dentro de Library
const FolderSchema = z.object({
  name: z.string().min(1, 'El nombre de la carpeta es obligatorio'),
  slug: z.string(),
  description: z.string().optional(),
  parent_id: z.unknown().optional() // Compatible con ObjectId
});

// Tipo para las carpetas
export type IFolder = z.infer<typeof FolderSchema>;

// Esquema base para Library
export const LibraryBaseSchema = z.object({
  _id: z.unknown().optional(), // Usando unknown para permitir compatibilidad con ObjectId
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no debe exceder 100 caracteres'),
  slug: z.string(),
  description: z.string()
    .max(500, 'La descripción no debe exceder 500 caracteres')
    .optional(),
  user_id: z.unknown({
    required_error: 'El ID del usuario propietario es obligatorio'
  }), // Usando unknown para compatibilidad con ObjectId
  defaultStorageProvider: z.enum(['minio']),
  folders: z.array(FolderSchema).optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Tipo base para Library
export type ILibraryBase = z.infer<typeof LibraryBaseSchema>;

// Esquema para creación de Library
export const CreateLibrarySchema = LibraryBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no debe exceder 100 caracteres')
  });

export type ICreateLibrary = z.infer<typeof CreateLibrarySchema>;

// Esquema para actualización de Library (todos los campos opcionales)
export const UpdateLibrarySchema = LibraryBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateLibrary = z.infer<typeof UpdateLibrarySchema>;

// Esquema para respuestas (sin campos sensibles)
export const LibraryResponseSchema = LibraryBaseSchema
  .omit({ isDeleted: true });

export type ILibraryResponse = z.infer<typeof LibraryResponseSchema>;

// Función auxiliar para convertir Library a LibraryResponse
export const libraryToResponse = (library: unknown): ILibraryResponse => {
  // Convertir documento Mongoose a objeto plano si es necesario
  const libraryObj = library && typeof (library as Record<string, unknown>).toObject === 'function'
    ? (library as Record<string, unknown> & { toObject: () => Record<string, unknown> }).toObject()
    : (library && typeof (library as Record<string, unknown>).toJSON === 'function' ? (library as Record<string, unknown> & { toJSON: () => Record<string, unknown> }).toJSON() : library);

  // Convertir a objeto tipado para acceso a propiedades
  const typedObj = libraryObj as Record<string, unknown>;

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
    description: (typedObj?.description as string) || '',
    user_id: typedObj?.user_id || '',
    defaultStorageProvider: (typedObj?.defaultStorageProvider as 'minio') || 'minio',
    folders: (typedObj?.folders as { name: string; slug: string; description?: string; parent_id?: unknown }[]) || [],
    isActive: typedObj?.isActive !== undefined ? (typedObj.isActive as boolean) : true,
    createdAt: (typedObj?.createdAt as Date) || new Date(),
    updatedAt: (typedObj?.updatedAt as Date) || new Date()
  };
}; 