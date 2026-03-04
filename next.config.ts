import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/**
 * ===============================
 * NOTAS PARA PABLITO (DEV SETUP)
 * ===============================
 *
 * Problema detectado en Windows:
 * Next.js 16 usa Turbopack por defecto en `next dev`.
 * En algunos entornos Windows puede fallar con:
 *
 *   Turbopack Error: failed to create whole tree
 *
 * Esto ocurre antes de que la app siquiera compile.
 *
 * Solución aplicada:
 * Forzamos a Next a usar Webpack en desarrollo
 * deshabilitando Turbopack explícitamente.
 *
 * Esto NO afecta producción ni build final.
 */

const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
    ? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(",")
    : [],

  turbopack: {
    // Evita inferencias incorrectas de workspace en Windows
    root: process.cwd(),
  },
};

export default withSerwist(nextConfig);