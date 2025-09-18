/**
 * Modelo para MediaTag
 */
import mongoose, { Document, Schema } from 'mongoose';
import { IMediaTagBase } from './MediaTagSchema';

// Extender la interfaz base con los métodos de Document de Mongoose
export interface IMediaTag extends Document, Omit<IMediaTagBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

const mediaTagSchema = new Schema<IMediaTag>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },


    // Campo para borrado lógico
    isDeleted: {
      type: Boolean,
      default: false,
      select: false // No incluir por defecto en las consultas
    }
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt
    toJSON: {
      transform: (_doc: Document, ret: Record<string, unknown>): Record<string, unknown> => {
        delete ret.isDeleted;
        return ret;
      }
    }
  }
);

// Añadir índices
mediaTagSchema.index({ name: 1 }, { unique: true });

// Índice para consultas que excluyen elementos borrados
mediaTagSchema.index({ isDeleted: 1 });

export const MediaTagModel = mongoose.model<IMediaTag>(
  'MediaTag',
  mediaTagSchema
); 