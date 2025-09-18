import { z } from 'zod';

// Esquema para traducciones de categorías
export const CategoryTranslationSchema = z.object({
  locale: z.string(),
  name: z.string().min(1, 'name debe tener al menos 1 caracteres').max(100, 'name no debe exceder 100 caracteres'),
  slug: z.string(),
  description: z.string().max(500, 'description no debe exceder 500 caracteres').optional(),
  seo: z.object({
    meta_title: z.string().max(60, 'meta_title no debe exceder 60 caracteres').optional(),
    meta_description: z.string().max(160, 'meta_description no debe exceder 160 caracteres').optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export type ICategoryTranslation = z.infer<typeof CategoryTranslationSchema>;

// Esquema base para Category
export const CategoryBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  default_locale: z.string(),
  parent_id: z.any().optional(),
  order: z.number(),
  icon: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'color debe cumplir con el patrón requerido').optional(),
  media_id: z.any().optional(),
  isActive: z.boolean(),
  categories: z.array(CategoryTranslationSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Category
export type ICategoryBase = z.infer<typeof CategoryBaseSchema>;

// Esquema para creación de Category
export const CreateCategorySchema = CategoryBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    default_locale: z.string(),
    order: z.number(),
    isActive: z.boolean(),
    categories: z.array(CategoryTranslationSchema).min(1, 'Debe tener al menos una traducción'),
  });

export type ICreateCategory = z.infer<typeof CreateCategorySchema>;

// Esquema para actualización de Category (todos los campos opcionales)
export const UpdateCategorySchema = CategoryBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateCategory = z.infer<typeof UpdateCategorySchema>;

// Esquema para respuestas (sin campos sensibles)
export const CategoryResponseSchema = CategoryBaseSchema
  .omit({ isDeleted: true });

export type ICategoryResponse = z.infer<typeof CategoryResponseSchema>; 