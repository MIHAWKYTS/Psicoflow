/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Variáveis de ambiente expostas ao client
  env: {
    NEXT_PUBLIC_APP_NAME: 'PsicoFlow',
  },
};

export default nextConfig;
