"use client";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Em produção, esses dados virão do contexto de autenticação ou da sessão.
  // Por enquanto, usamos mocks para renderização estática rápida.
  const userRole = "psicologo";
  const nomeClinica = "Espaço Psicologia Integrada";
  const statusAssinatura = "trial";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950/60 overflow-hidden font-sans transition-all duration-300">
      {/* Sidebar do Menu */}
      <DashboardSidebar userRole={userRole} />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cabeçalho */}
        <DashboardHeader
          nomeClinica={nomeClinica}
          statusAssinatura={statusAssinatura}
        />

        {/* Corpo da página com scroll independente */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
