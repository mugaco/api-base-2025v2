/**
 * Modelo para Publication
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IPublicationBase } from './PublicationSchema';
import { CMS_SUPPORTED_PUBLICATION_TYPES, CMS_DEFAULT_PUBLICATION_TYPE } from '@packages/cms/config/cms.config';

// Interface para las traducciones individuales
interface IPublicationTranslation {
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status: 'draft' | 'published';
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

// Interface para el modelo principal extendiendo Document
export interface IPublication extends Document, Omit<IPublicationBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Esquema para las traducciones individuales
const publicationTranslationSchema = new Schema<IPublicationTranslation>({
  locale: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    maxlength: 500,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["draft", "published"],
    default: "draft",
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

// Definir esquema principal de Publication
const publicationSchema = new Schema<IPublication>(
  {
    default_locale: {
      type: String,
      required: true,
      default: "es-ES",
    },
    type: {
      type: String,
      required: true,
      enum: CMS_SUPPORTED_PUBLICATION_TYPES,
      default: CMS_DEFAULT_PUBLICATION_TYPE,
    },
    status: {
      type: String,
      required: true,
      enum: ["draft","published","archived"],
      default: "draft",
    },
    format: {
      type: String,
      required: true,
      enum: ["markdown","html","json"],
      default: "markdown",
    },
    media_id: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    media_ids: {
      type: [Schema.Types.ObjectId],
      ref: 'Media',
      default: [],
    },
    category_ids: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    tag_ids: {
      type: [Schema.Types.ObjectId],
      ref: 'Tag',
      default: [],
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    publications: [publicationTranslationSchema],

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
    collection: 'publications',
    strict: true
  }
);

// Añadir índices
publicationSchema.index({ type: 1 });
publicationSchema.index({ status: 1 });
publicationSchema.index({ media_id: 1 }, { sparse: true });
publicationSchema.index({ user_id: 1 });
publicationSchema.index({ "publications.slug": 1, "publications.locale": 1 }, { unique: true });
publicationSchema.index({ "publications.locale": 1 });

// Índice para consultas que excluyen elementos borrados
publicationSchema.index({ isDeleted: 1 });

// Índices optimizados para las consultas del informe
// Para búsquedas de texto completo en títulos (consulta 1: publications.title like "tutorial")
publicationSchema.index({ 
  "publications.title": "text", 
  "publications.excerpt": "text" 
});

// Para consultas por tipo, autor y fecha (consulta 3: artículos por autor específico)
publicationSchema.index({ 
  type: 1, 
  user_id: 1, 
  createdAt: -1 
});

// Para consultas de contenido publicado por locale y status (consulta 2 optimizada)
publicationSchema.index({ 
  "publications.locale": 1, 
  "publications.status": 1,
  createdAt: -1 
});

// Crear y exportar modelo
export const PublicationModel = mongoose.model<IPublication>(
  'Publication',
  publicationSchema
); 