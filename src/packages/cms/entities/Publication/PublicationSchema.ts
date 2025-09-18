import { z } from 'zod';
import { CMS_PUBLICATION_TYPES_TUPLE } from '@packages/cms/config/cms.config';
import { IMedia } from '@packages/media/entities/Media/MediaModel';

// Esquema para las traducciones individuales de publicaciones
export const PublicationTranslationSchema = z.object({
  locale: z.string(),
  title: z.string().min(1, 'title debe tener al menos 1 caracteres').max(200, 'title no debe exceder 200 caracteres'),
  slug: z.string(),
  excerpt: z.string().max(500, 'excerpt no debe exceder 500 caracteres').optional(),
  body: z.string(),
  status: z.enum(['draft', 'published']).default('draft'),
  seo: z.object({
    meta_title: z.string().max(60, 'meta_title no debe exceder 60 caracteres').optional(),
    meta_description: z.string().max(160, 'meta_description no debe exceder 160 caracteres').optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export type IPublicationTranslation = z.infer<typeof PublicationTranslationSchema>;

// Esquema base para Publication
export const PublicationBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  default_locale: z.string(),
  type: z.enum(CMS_PUBLICATION_TYPES_TUPLE),
  status: z.enum(['draft', 'published', 'archived']),
  format: z.enum(['markdown', 'html', 'json']),
  media_id: z.any().optional(),
  media_ids: z.array(z.object({})).optional(),
  category_ids: z.array(z.object({})).optional(),
  tag_ids: z.array(z.object({})).optional(),
  user_id: z.any(),
  publishedAt: z.date().optional(),
  metadata: z.object({}).optional(),
  publications: z.array(PublicationTranslationSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Publication
export type IPublicationBase = z.infer<typeof PublicationBaseSchema>;

// Esquema para creación de Publication
export const CreatePublicationSchema = PublicationBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    default_locale: z.string(),
    type: z.enum(CMS_PUBLICATION_TYPES_TUPLE),
    status: z.enum(['draft', 'published', 'archived']),
    format: z.enum(['markdown', 'html', 'json']),
    user_id: z.any(),
    publications: z.array(PublicationTranslationSchema).min(1, 'Debe tener al menos una publicación'),
  });

export type ICreatePublication = z.infer<typeof CreatePublicationSchema>;

// Esquema para actualización de Publication (todos los campos opcionales)
export const UpdatePublicationSchema = PublicationBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdatePublication = z.infer<typeof UpdatePublicationSchema>;

// Esquema para respuestas (sin campos sensibles)
export const PublicationResponseSchema = PublicationBaseSchema
  .omit({ isDeleted: true });

export type IPublicationResponse = z.infer<typeof PublicationResponseSchema>;

// Esquema mínimo para la entrada inicial (solo title y type)
export const MinimalPublicationSchema = z.object({
  title: z.string().min(1, 'title debe tener al menos 1 caracteres').max(200, 'title no debe exceder 200 caracteres'),
  type: z.enum(CMS_PUBLICATION_TYPES_TUPLE),
});

export type IMinimalPublication = z.infer<typeof MinimalPublicationSchema>;

// ESQUEMAS ESPECIALIZADOS PARA ENDPOINTS PATCH

// Esquema para actualizar estado global
export const UpdateGlobalStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived'], {
    errorMap: () => ({ message: 'El estado debe ser: draft, published o archived' })
  })
});

export type IUpdateGlobalStatus = z.infer<typeof UpdateGlobalStatusSchema>;

// Esquema para actualizar tipo de publicación
export const UpdatePublicationTypeSchema = z.object({
  type: z.enum(CMS_PUBLICATION_TYPES_TUPLE, {
    errorMap: () => ({ message: `El tipo debe ser uno de: ${CMS_PUBLICATION_TYPES_TUPLE.join(', ')}` })
  })
});

export type IUpdatePublicationType = z.infer<typeof UpdatePublicationTypeSchema>;

// Esquema para actualizar categorías (array de ObjectIds)
export const UpdateCategoriesSchema = z.object({
  category_ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoría inválido'))
    .min(0, 'El array de categorías no puede estar vacío si se proporciona')
    .max(10, 'No se pueden asignar más de 10 categorías')
});

export type IUpdateCategories = z.infer<typeof UpdateCategoriesSchema>;

// Esquema para actualizar tags (array de ObjectIds)
export const UpdateTagsSchema = z.object({
  tag_ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de tag inválido'))
    .min(0, 'El array de tags no puede estar vacío si se proporciona')
    .max(20, 'No se pueden asignar más de 20 tags')
});

export type IUpdateTags = z.infer<typeof UpdateTagsSchema>;

// Esquema para actualizar imagen destacada
export const UpdateFeaturedImageSchema = z.object({
  media_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de media inválido').optional().nullable()
});

export type IUpdateFeaturedImage = z.infer<typeof UpdateFeaturedImageSchema>;

// Esquema para actualizar galería de imágenes  
export const UpdateGallerySchema = z.object({
  media_ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de media inválido'))
    .max(50, 'No se pueden asignar más de 50 imágenes a la galería')
});

export type IUpdateGallery = z.infer<typeof UpdateGallerySchema>;

// TIPOS ESPECIALIZADOS PARA RESPUESTAS DE MÉTODOS ESPECÍFICOS

// Tipo para la respuesta de getPublicationMedia
export interface IMediaPublication {
  featured: IMedia | null;
  gallery: IMedia[];
} 