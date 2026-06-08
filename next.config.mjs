/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fixa a raiz do workspace para esta pasta, evitando que o Turbopack
  // detecte o package-lock.json do diretório pai e congele o sistema.
  turbopack: {
    root: new URL(".", import.meta.url).pathname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  // Variáveis de ambiente expostas ao client
  env: {
    NEXT_PUBLIC_APP_NAME: 'PsicoFlow',
  },
};

export default nextConfig;
