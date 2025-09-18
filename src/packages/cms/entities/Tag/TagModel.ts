/**
 * Modelo para Tag
 */
import mongoose, { Schema, Document } from 'mongoose';
import { ITagBase } from './TagSchema';

// Interface para traducciones de etiquetas
interface ITagTranslation {
  locale: string;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

// Interface para el modelo extendiendo Document
export interface ITag extends Document, Omit<ITagBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Esquema para traducciones de etiquetas
const tagTranslationSchema = new Schema<ITagTranslation>({
  locale: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 200,
  },
  seo: {
    meta_title: {
      type: String,
      maxlength: 60,
    },
    meta_description: {
      type: String,
      maxlength: 160,
    },
    keywords: [{
      type: String,
    }]
  }
}, { _id: false });

// Definir esquema de Tag
const tagSchema = new Schema<ITag>(
  {
    default_locale: {
      type: String,
      required: true,
      default: "es-ES",
    },
    color: {
      type: String,
    },
    icon: {
      type: String,
    },
    media_id: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    tags: [tagTranslationSchema],

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
    collection: 'tags',
    strict: true
  }
);

// Añadir índices
tagSchema.index({ media_id: 1 }, { sparse: true });
tagSchema.index({ "tags.slug": 1, "tags.locale": 1 }, { unique: true });
tagSchema.index({ "tags.locale": 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ isActive: 1 });

// Índice para consultas que excluyen elementos borrados
tagSchema.index({ isDeleted: 1 });

// Crear y exportar modelo
export const TagModel = mongoose.model<ITag>(
  'Tag',
  tagSchema
); 