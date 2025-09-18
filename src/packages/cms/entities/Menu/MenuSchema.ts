import { z } from 'zod';

// Esquema para traducciones de menús
export const MenuTranslationSchema = z.object({
  locale: z.string(),
  name: z.string().min(1, 'name debe tener al menos 1 caracteres').max(100, 'name no debe exceder 100 caracteres'),
  slug: z.string(),
  description: z.string().max(200, 'description no debe exceder 200 caracteres').optional(),
  items: z.array(z.object({
    type: z.enum(['link', 'dropdown', 'separator']).optional(),
    label: z.string().optional(),
    url: z.string().optional(),
    target: z.enum(['_self', '_blank', '_parent', '_top']).optional(),
    children: z.array(z.object({}).passthrough()).optional(),
    isActive: z.boolean().optional(),
    order: z.number().optional(),
  })).optional(),
});

export type IMenuTranslation = z.infer<typeof MenuTranslationSchema>;

// Esquema base para Menu
export const MenuBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  default_locale: z.string(),
  location: z.enum(['header', 'footer', 'sidebar', 'mobile', 'custom']),
  isActive: z.boolean(),
  menus: z.array(MenuTranslationSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Menu
export type IMenuBase = z.infer<typeof MenuBaseSchema>;

// Esquema para creación de Menu
export const CreateMenuSchema = MenuBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    default_locale: z.string(),
    location: z.enum(['header', 'footer', 'sidebar', 'mobile', 'custom']),
    isActive: z.boolean(),
    menus: z.array(MenuTranslationSchema).min(1, 'Debe tener al menos una traducción'),
  });

export type ICreateMenu = z.infer<typeof CreateMenuSchema>;

// Esquema para actualización de Menu (todos los campos opcionales)
export const UpdateMenuSchema = MenuBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateMenu = z.infer<typeof UpdateMenuSchema>;

// Esquema para respuestas (sin campos sensibles)
export const MenuResponseSchema = MenuBaseSchema
  .omit({ isDeleted: true });

export type IMenuResponse = z.infer<typeof MenuResponseSchema>; 