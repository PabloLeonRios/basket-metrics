import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const globalForMongoose = global as typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached =
  globalForMongoose.mongoose ??
  (globalForMongoose.mongoose = { conn: null, promise: null });

function isDemoMode() {
  // En server también podés leer NEXT_PUBLIC_* (aunque sea "public")
  return process.env.DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

export default async function dbConnect() {
  // ✅ DEMO: no rompe builds, no exige Mongo
  if (isDemoMode()) return null;

  const MONGODB_URI = process.env.MONGODB_URI;

  // ✅ Prod/real: ahí sí exigimos Mongo
  if (!MONGODB_URI) {
    throw new Error("Por favor, define la variable de entorno MONGODB_URI");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}