import { z } from 'zod';

// Esquema base para Prueba
export const PruebaBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  name: z.string().describe('nombre del recurso'),
  user_id: z.any().describe('owner'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Prueba
export type IPruebaBase = z.infer<typeof PruebaBaseSchema>;

// Esquema para creación de Prueba
export const CreatePruebaSchema = PruebaBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().describe('nombre del recurso'),
    user_id: z.any().describe('owner'),
  });

export type ICreatePrueba = z.infer<typeof CreatePruebaSchema>;

// Esquema para actualización de Prueba (todos los campos opcionales)
export const UpdatePruebaSchema = PruebaBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdatePrueba = z.infer<typeof UpdatePruebaSchema>;

// Esquema para respuestas (sin campos sensibles)
export const PruebaResponseSchema = PruebaBaseSchema
  .omit({ isDeleted: true });

export type IPruebaResponse = z.infer<typeof PruebaResponseSchema>; 