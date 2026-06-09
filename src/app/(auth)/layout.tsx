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
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-500/25">
              Ψ
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
              PsiGen
            </span>
          </div>

          {children}
        </div>
      </div>

      {/* Painel Direito (Visual Inspirador) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-violet-600 dark:from-slate-900 dark:to-slate-950 relative overflow-hidden">
        {/* Detalhes de grade e círculos decorativos */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/5 rounded-full blur-3xl" />

        {/* Branding e Versão */}
        <div className="relative z-10 text-white/80 font-semibold text-sm">
          PsiGen v1.0.0
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 max-w-md space-y-8">
          {/* Badge de trial */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            15 dias grátis · Sem cartão de crédito
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Tudo que você precisa para gerir sua clínica.
            </h2>
            <p className="text-indigo-100 dark:text-slate-400 text-sm leading-relaxed">
              Agenda, prontuários, financeiro e muito mais — em uma plataforma segura e feita para psicólogos.
            </p>
          </div>

          {/* Lista de benefícios */}
          <ul className="space-y-3">
            {[
              "Agenda mensal com lembretes via WhatsApp",
              "Prontuários clínicos com controle de acesso",
              "Financeiro completo: receitas e despesas",
              "Multi-usuário: psicólogos e secretárias",
              "Dados 100% isolados por clínica (LGPD)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Citação */}
          <div className="pt-2 border-t border-white/20">
            <blockquote className="text-sm font-medium text-white/75 leading-relaxed italic">
              "O curioso paradoxo é que quando eu me aceito como sou, então eu posso mudar."
            </blockquote>
            <cite className="block text-xs font-bold text-indigo-200 dark:text-indigo-400 not-italic uppercase tracking-widest mt-2">
              — Carl Rogers
            </cite>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/60 font-medium">
          &copy; {new Date().getFullYear()} PsiGen. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
