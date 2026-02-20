// src/lib/auth-secret.ts

// Usar una función para obtener el secreto en el momento de uso, no al importar el módulo.
// Esto evita errores en el build time o en entornos donde las variables no están listas inmediatamente.
export function getJwtSecretKey(): Uint8Array {
  // Asegurarse de que el secreto está disponible
  if (!process.env.JWT_SECRET) {
    // Para desarrollo, podemos usar un secreto por defecto si no está definido,
    // pero lanzar un error en producción.
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Advertencia: JWT_SECRET no está definido, usando valor por defecto inseguro.',
      );
      return new TextEncoder().encode('secreto_inseguro_por_defecto_para_dev');
    }
    throw new Error('La variable de entorno JWT_SECRET no está definida.');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}
