/**
 * Modelo para LibraryTag
 */
import mongoose, { Document, Schema } from 'mongoose';
import { ILibraryTagBase } from './LibraryTagSchema';

// Extender la interfaz base con los métodos de Document de Mongoose
export interface ILibraryTag extends Document, Omit<ILibraryTagBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

const libraryTagSchema = new Schema<ILibraryTag>(
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
libraryTagSchema.index({ name: 1 }, { unique: true });

// Índice para consultas que excluyen elementos borrados
libraryTagSchema.index({ isDeleted: 1 });

export const LibraryTagModel = mongoose.model<ILibraryTag>(
  'LibraryTag',
  libraryTagSchema
); 