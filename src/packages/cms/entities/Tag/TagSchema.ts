import { z } from 'zod';

// Esquema para traducciones de etiquetas
export const TagTranslationSchema = z.object({
  locale: z.string(),
  name: z.string().min(1, 'name debe tener al menos 1 caracteres').max(50, 'name no debe exceder 50 caracteres'),
  slug: z.string(),
  description: z.string().max(200, 'description no debe exceder 200 caracteres').optional(),
  seo: z.object({
    meta_title: z.string().max(60, 'meta_title no debe exceder 60 caracteres').optional(),
    meta_description: z.string().max(160, 'meta_description no debe exceder 160 caracteres').optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export type ITagTranslation = z.infer<typeof TagTranslationSchema>;

// Esquema base para Tag
export const TagBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  default_locale: z.string(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'color debe cumplir con el patrón requerido').optional(),
  icon: z.string().optional(),
  media_id: z.any().optional(),
  usageCount: z.number(),
  isActive: z.boolean(),
  tags: z.array(TagTranslationSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Tag
export type ITagBase = z.infer<typeof TagBaseSchema>;

// Esquema para creación de Tag
export const CreateTagSchema = TagBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    default_locale: z.string(),
    usageCount: z.number(),
    isActive: z.boolean(),
    tags: z.array(TagTranslationSchema).min(1, 'Debe tener al menos una traducción'),
  });

export type ICreateTag = z.infer<typeof CreateTagSchema>;

// Esquema para actualización de Tag (todos los campos opcionales)
export const UpdateTagSchema = TagBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateTag = z.infer<typeof UpdateTagSchema>;

// Esquema para respuestas (sin campos sensibles)
export const TagResponseSchema = TagBaseSchema
  .omit({ isDeleted: true });

export type ITagResponse = z.infer<typeof TagResponseSchema>; 