/**
 * Modelo para Category
 */
import mongoose, { Schema, Document } from 'mongoose';
import { ICategoryBase } from './CategorySchema';

// Interface para traducciones de categorías
interface ICategoryTranslation {
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
export interface ICategory extends Document, Omit<ICategoryBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Esquema para traducciones de categorías
const categoryTranslationSchema = new Schema<ICategoryTranslation>({
  locale: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
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

// Definir esquema de Category
const categorySchema = new Schema<ICategory>(
  {
    default_locale: {
      type: String,
      required: true,
      default: "es-ES",
    },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    icon: {
      type: String,
    },
    color: {
      type: String,
    },
    media_id: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    categories: [categoryTranslationSchema],

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
    collection: 'categories',
    strict: true
  }
);

// Añadir índices
categorySchema.index({ parent_id: 1 }, { sparse: true });
categorySchema.index({ media_id: 1 }, { sparse: true });
categorySchema.index({ "categories.slug": 1, "categories.locale": 1 }, { unique: true });
categorySchema.index({ "categories.locale": 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

// Índice para consultas que excluyen elementos borrados
categorySchema.index({ isDeleted: 1 });

// Crear y exportar modelo
export const CategoryModel = mongoose.model<ICategory>(
  'Category',
  categorySchema
); 