/**
 * Modelo para Product
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IProductBase } from './ProductSchema';

// Interface para el modelo extendiendo Document
export interface IProduct extends Document, Omit<IProductBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Definir esquema de Product
const productSchema = new Schema<IProduct>(
  {
        name: {
      type: String,
      required: true,
      // Name
    },
    active: {
      type: Boolean,
      required: true,
      // Active
      default: true,
    },
    price: {
      type: Number,
      required: true,
      // Price
    },

    // Campo para borrado lógico
    isDeleted: {
      type: Boolean,
      default: false,
      select: false // No incluir por defecto en las consultas
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: Document, ret: Record<string, unknown>): Record<string, unknown> => {
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      }
    },
    collection: 'products',
    strict: true
  }
);

// Añadir índices
productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ active: 1 });


// Índice para consultas que excluyen elementos borrados
productSchema.index({ isDeleted: 1 });

// Crear y exportar modelo
export const ProductModel = mongoose.model<IProduct>(
  'Product',
  productSchema
); 