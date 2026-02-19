import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Dynamically configure allowedDevOrigins from an environment variable
    // NEXT_PUBLIC_ALLOWED_DEV_ORIGINS can be a comma-separated list (e.g., "http://localhost:3000,https://my-dev-domain.com")
    allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
      ? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(',')
      : [],
  },
};

export default nextConfig;
