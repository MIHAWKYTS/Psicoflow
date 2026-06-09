"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import type { UserRole } from "@prisma/client";

type ShellRole = UserRole | "admin" | "psicologo" | "psicologo_admin";

interface DashboardShellProps {
  userRole: ShellRole;
  userName: string;
  statusAssinatura: "trial" | "ativo" | "inadimplente" | "cancelado";
  dataFimTrial?: string | null;
  children: React.ReactNode;
}

export default function DashboardShell({
  userRole,
  userName,
  statusAssinatura,
  dataFimTrial,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        userRole={userRole}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          statusAssinatura={statusAssinatura}
          dataFimTrial={dataFimTrial ?? undefined}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
