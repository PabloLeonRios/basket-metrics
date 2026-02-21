import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IUser } from '@/types/definitions';

// La interfaz IUser ahora se importa desde un archivo central.
// Añadimos & Document para que Mongoose sepa que es un documento de la BD.
type UserDocument = IUser & Document;

// Esquema de Mongoose para el Usuario
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor, introduce un email válido.',
      ],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      select: false, // No incluir la contraseña en las consultas por defecto
    },
    role: {
      type: String,
      required: true,
      enum: ['entrenador', 'jugador', 'admin'],
      default: 'jugador',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    // team: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Team',
    //   required: false,
    // },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
  },
);

// Evitar sobreescribir el modelo si ya ha sido compilado
const User: Model<UserDocument> =
  models.User || mongoose.model<UserDocument>('User', UserSchema);

export default User;
