/**
 * Modelo para Menu
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IMenuBase } from './MenuSchema';

// Interface para traducciones de menús
interface IMenuTranslation {
  locale: string;
  name: string;
  slug: string;
  description?: string;
  items?: Array<{
    type?: 'link' | 'dropdown' | 'separator';
    label?: string;
    url?: string;
    target?: '_self' | '_blank' | '_parent' | '_top';
    children?: Record<string, unknown>[];
    isActive?: boolean;
    order?: number;
  }>;
}

// Interface para el modelo extendiendo Document
export interface IMenu extends Document, Omit<IMenuBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Esquema para traducciones de menús
const menuTranslationSchema = new Schema<IMenuTranslation>({
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
    maxlength: 200,
  },
  items: [{
    type: {
      type: String,
      enum: ['link', 'dropdown', 'separator'],
    },
    label: {
      type: String,
    },
    url: {
      type: String,
    },
    target: {
      type: String,
      enum: ['_self', '_blank', '_parent', '_top'],
      default: '_self',
    },
    children: [{
      type: Schema.Types.Mixed,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    }
  }]
}, { _id: false });

// Definir esquema de Menu
const menuSchema = new Schema<IMenu>(
  {
    default_locale: {
      type: String,
      required: true,
      default: "es-ES",
    },
    location: {
      type: String,
      required: true,
      enum: ["header","footer","sidebar","mobile","custom"],
      default: "header",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    menus: [menuTranslationSchema],

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
    collection: 'menus',
    strict: true
  }
);

// Añadir índices
menuSchema.index({ location: 1 });
menuSchema.index({ "menus.slug": 1, "menus.locale": 1 }, { unique: true });
menuSchema.index({ "menus.locale": 1 });
menuSchema.index({ isActive: 1 });

// Índice para consultas que excluyen elementos borrados
menuSchema.index({ isDeleted: 1 });

// Crear y exportar modelo
export const MenuModel = mongoose.model<IMenu>(
  'Menu',
  menuSchema
); 