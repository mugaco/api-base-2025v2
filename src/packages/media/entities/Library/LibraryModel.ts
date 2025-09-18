/**
 * Modelo para Library
 */
import mongoose, { Document, Schema } from 'mongoose';
import { ILibraryBase, IFolder } from './LibrarySchema';

// La interfaz IFolder se reutiliza desde LibrarySchema.ts

// Extendiendo la interfaz del modelo para incluir explícitamente user_id
export interface ILibrary extends Document, Omit<ILibraryBase, '_id'> {
  // Document ya proporciona _id, por lo que lo omitimos
  user_id: mongoose.Types.ObjectId;
}

const folderSchema = new Schema<IFolder>({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  description: String,
  parent_id: {
    type: Schema.Types.ObjectId,
    // Referencia opcional a carpeta padre
    default: null
  }
  // Otros campos relevantes
});

const librarySchema = new Schema<ILibrary>(
  {
    name: {
      type: String,
      required: true,
      // Nombre de la biblioteca de medios
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      //Slug del nombre de la biblioteca de medios
    },
    description: {
      type: String,
      // Descripción de la biblioteca de medios
      maxlength: 500,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      // ID del usuario propietario de la biblioteca
      ref: 'User'
    },
    defaultStorageProvider: {
      type: String,
      required: true,
      // Proveedor de almacenamiento predeterminado
      enum: ["minio"],
      default: "minio",
    },
    folders: {
      type: [folderSchema],
      // Estructura de carpetas de un solo nivel
      default: []
    },
    isActive: {
      type: Boolean,
      required: true,
      // Indica si la biblioteca está activa
      default: true,
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
librarySchema.index({ name: 1 });

// Índice único compuesto por nombre y usuario propietario
librarySchema.index({ name: 1, user_id: 1 }, { unique: true });

// Índice para consultas que excluyen elementos borrados
librarySchema.index({ isDeleted: 1 });

export const LibraryModel = mongoose.model<ILibrary>(
  'Library',
  librarySchema
); 