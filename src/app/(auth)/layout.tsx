"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Botão flutuante de Dark Mode no topo superior direito */}
      <div className="absolute top-4 right-4 z-55">
        <ThemeToggle />
      </div>

      {/* Painel Esquerdo (Formulário) */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-sky-500/25">
              Ψ
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
              PsicoFlow
            </span>
          </div>

          {children}
        </div>
      </div>

      {/* Painel Direito (Visual Inspirador) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-sky-500 to-sky-600 dark:from-slate-900 dark:to-slate-950 relative overflow-hidden">
        {/* Detalhes de grade e círculos decorativos */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-400/20 dark:bg-sky-500/5 rounded-full blur-3xl" />

        {/* Branding e Versão */}
        <div className="relative z-10 text-white/80 font-semibold text-sm">
          PsicoFlow v1.0.0
        </div>

        {/* Citação Inspiradora do Psicoterapeuta */}
        <div className="relative z-10 max-w-md space-y-4">
          <blockquote className="text-2xl font-medium text-white/90 leading-normal tracking-tight italic">
            "O curioso paradoxo é que quando eu me aceito como sou, então eu posso mudar."
          </blockquote>
          <cite className="block text-sm font-bold text-sky-200 dark:text-sky-400 not-italic uppercase tracking-widest">
            — Carl Rogers
          </cite>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/60 font-medium">
          &copy; {new Date().getFullYear()} PsicoFlow. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
