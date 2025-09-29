import { z } from 'zod';

// Esquema base para Product
export const ProductBaseSchema = z.object({
  _id: z.any().optional(), // Usando any para permitir compatibilidad con ObjectId
  name: z.string().describe('Name'),
  active: z.boolean().describe('Active'),
  price: z.number().describe('Price'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
});

// Tipo base para Product
export type IProductBase = z.infer<typeof ProductBaseSchema>;

// Esquema para creación de Product
export const CreateProductSchema = ProductBaseSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().describe('Name'),
    active: z.boolean().describe('Active'),
    price: z.number().describe('Price'),
  });

export type ICreateProduct = z.infer<typeof CreateProductSchema>;

// Esquema para actualización de Product (todos los campos opcionales)
export const UpdateProductSchema = ProductBaseSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true });

export type IUpdateProduct = z.infer<typeof UpdateProductSchema>;

// Esquema para respuestas (sin campos sensibles)
export const ProductResponseSchema = ProductBaseSchema
  .omit({ isDeleted: true });

export type IProductResponse = z.infer<typeof ProductResponseSchema>; 