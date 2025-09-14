/**
 * Modelo para Prueba
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IPruebaBase } from './PruebaSchema';

// Interface para el modelo extendiendo Document
export interface IPrueba extends Document, Omit<IPruebaBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Definir esquema de Prueba
const pruebaSchema = new Schema<IPrueba>(
  {
        name: {
      type: String,
      required: true,
      // nombre del recurso
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // owner
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
    collection: 'pruebas',
    strict: true
  }
);

// Añadir índices
pruebaSchema.index({ name: 1 }, { unique: true });
pruebaSchema.index({ user_id: 1 });


// Índice para consultas que excluyen elementos borrados
pruebaSchema.index({ isDeleted: 1 });

// Crear y exportar modelo
export const PruebaModel = mongoose.model<IPrueba>(
  'Prueba',
  pruebaSchema
); 