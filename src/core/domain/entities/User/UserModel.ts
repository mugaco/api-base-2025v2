import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserRole } from './UserSchema';
export { IUser, UserRole };

export type IUserModel = IUser & Document & {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

const UserSchema = new Schema<IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor ingrese un email válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No incluir en las consultas por defecto
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true
    },
    lang: {
      type: String,
      default: 'es',
    },
    avatar: {
      type: String,
      default: null,
    },
    theme: {
      type: String,
      default: 'dark',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: Document, ret: Record<string, unknown>): Record<string, unknown> => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash de la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// Mongoose ya crea automáticamente índices para los campos con unique: true,
// por lo que no es necesario definirlos explícitamente con UserSchema.index.
// Eliminamos estas líneas para evitar el warning de índices duplicados:
// UserSchema.index({ email: 1 }, { unique: true });
// UserSchema.index({ username: 1 }, { unique: true });

export const UserModel = mongoose.model<IUserModel>('User', UserSchema); 