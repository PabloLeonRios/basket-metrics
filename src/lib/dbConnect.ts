// src/lib/dbConnect.ts
import mongoose from "mongoose";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 *
 * Este archivo maneja la conexión a MongoDB.
 *
 * IMPORTANTE:
 * Cuando NEXT_PUBLIC_DEMO_MODE = "1"
 * el sistema NO intenta conectarse a Mongo.
 *
 * Esto permite que Vercel compile el proyecto
 * aunque no exista MONGODB_URI.
 */

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Cache global de conexión
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  /**
   * Si estamos en modo demo
   * NO conectamos a Mongo
   */
  if (DEMO_MODE) {
    console.log("⚠ DEMO MODE: MongoDB deshabilitado");
    return null;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Por favor define la variable de entorno MONGODB_URI"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;