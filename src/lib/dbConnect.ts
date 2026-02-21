// src/lib/dbConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Por favor, define la variable de entorno MONGODB_URI dentro de .env.local',
  );
}

/**
 * Caché de conexión global. Esto evita crear una nueva conexión en cada recarga en caliente
 * en el entorno de desarrollo.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

  console.log('Connecting to MongoDB with URI:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'URI not set');
  cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
