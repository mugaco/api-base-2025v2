import mongoose, { Document, Schema } from 'mongoose';
import { IAccess as IAccessBase } from './AccessSchema';

// Extender la interfaz base con los métodos de Document de Mongoose
export interface IAccess extends Document, Omit<IAccessBase, '_id'> {
  _id: mongoose.Types.ObjectId;
}

const AccessSchema = new Schema<IAccess>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ip_address: {
      type: String,
      required: false
    },
    origin: {
      type: String,
      required: false
    },
    agent: {
      type: String,
      required: false
    },
    refreshtoken_id: {
      type: String,
      required: true
    },
        isDeleted: {
      type: Boolean,
      default: false,
    },
    is_revoked: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true
    },
    // Campos para recuperación de contraseña
    recovery_token: {
      type: String,
      default: null
    },
    recovery_expires: {
      type: Date,
      default: null
    },
    recovery_redirect_url: {
      type: String,
      default: null
    },
    recovery_used: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Crear índices para búsquedas frecuentes
AccessSchema.index({ refreshtoken_id: 1 }, { unique: true });
AccessSchema.index({ user_id: 1 });
AccessSchema.index({ is_revoked: 1 });
AccessSchema.index({ recovery_token: 1 });

export const AccessModel = mongoose.model<IAccess>('Access', AccessSchema); 