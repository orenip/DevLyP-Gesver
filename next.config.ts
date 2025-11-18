import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  
  // Ignora errores de TypeScript y ESLint durante la build
  // (Ten cuidado con esto en producción real)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ✅ Añade esta línea para la build optimizada "standalone"
  output: 'standalone',
};

export default nextConfig;