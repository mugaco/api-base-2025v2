/**
 * Modelo para Media
 */
import mongoose, { Document, Schema } from 'mongoose';
import { IMediaBase } from './MediaSchema';

export interface IMedia extends Document, Omit<IMediaBase, '_id'> {
  // Document ya proporciona _id, por lo que lo omitimos
}

const mediaSchema = new Schema<IMedia>(
  {
    filename: {
      type: String,
      required: true,
      // Nombre del archivo en el sistema de almacenamiento
    },
    originalFilename: {
      type: String,
      required: true,
      // Nombre original del archivo al ser subido
    },
    type: {
      type: String,
      required: true,
      // Tipo de archivo multimedia
      enum: ["image", "video", "document", "audio", "other"],
    },
    mimeType: {
      type: String,
      required: true,
      // Tipo MIME del archivo
    },
    size: {
      type: Number,
      required: true,
      // Tamaño del archivo en bytes
    },
    storage: {
      type: Schema.Types.Mixed,
      required: true,
      // Información agnóstica de almacenamiento
    },
    library_id: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
      // Referencia a la biblioteca a la que pertenece
    },
    library_slug: {
      type: String,
      required: true,
      // Nombre de la biblioteca
    },
    library_name: {
      type: String,
      required: true,
      // Nombre de la biblioteca
    },
    metadata: {
      type: Schema.Types.Mixed,
      // Metadatos del archivo multimedia
    },
    folder_id: {
      type: Schema.Types.ObjectId,
      // Referencia al _id de un subdocumento folder dentro de la biblioteca asociada
    },
    tag_ids: {
      type: [Schema.Types.ObjectId],
      ref: 'Tag',
      // Etiquetas asociadas al archivo
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Usuario que subió el archivo
    },
    variants: {
      type: [Schema.Types.Mixed],
      // Versiones redimensionadas o transformadas
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
mediaSchema.index({ type: 1 });
mediaSchema.index({ library_id: 1 });
mediaSchema.index({ folder_id: 1 }, { sparse: true });
mediaSchema.index({ user_id: 1 }, { sparse: true });
mediaSchema.index({ originalFilename: 1, library_id: 1 }, { unique: true });

// Índice para consultas que excluyen elementos borrados
mediaSchema.index({ isDeleted: 1 });

export const MediaModel = mongoose.model<IMedia>(
  'Media',
  mediaSchema
); 