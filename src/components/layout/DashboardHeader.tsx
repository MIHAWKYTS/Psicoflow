"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import { Bell, Sparkles, Menu } from "lucide-react";

interface HeaderProps {
  statusAssinatura?: "trial" | "ativo" | "inadimplente" | "cancelado";
  dataFimTrial?: string;
  onMenuToggle?: () => void;
}

const pageNames: Record<string, string> = {
  "/dashboard":                   "Visão Geral",
  "/dashboard/agenda":            "Agenda",
  "/dashboard/pacientes":         "Pacientes",
  "/dashboard/rotina":            "Rotina",
  "/dashboard/casos":             "Casos Clínicos",
  "/dashboard/prontuarios":       "Prontuários",
  "/dashboard/equipe":            "Equipe",
  "/dashboard/financeiro":        "Financeiro",
  "/dashboard/engajamento":       "Engajamento",
  "/dashboard/configuracoes":     "Configurações",
};

function getPageName(pathname: string): string {
  if (pageNames[pathname]) return pageNames[pathname];
  if (pathname.startsWith("/dashboard/pacientes/")) return "Perfil do Paciente";
  if (pathname.startsWith("/dashboard/prontuarios/")) return "Prontuário";
  return "Dashboard";
}

export default function DashboardHeader({
  statusAssinatura = "trial",
  dataFimTrial,
  onMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const pageName = getPageName(pathname);

  const daysLeft =
    statusAssinatura === "trial" && dataFimTrial
      ? Math.max(0, Math.ceil((new Date(dataFimTrial).getTime() - Date.now()) / 86_400_000))
      : null;

  const trialLabel =
    daysLeft !== null
      ? `Trial · ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`
      : "Free Trial";

  const statusConfig = {
    trial: {
      label: trialLabel,
      className:
        daysLeft !== null && daysLeft <= 3
          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
          : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    },
    ativo: {
      label: "Plano Ativo",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    },
    inadimplente: {
      label: "Inadimplente",
      className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
    },
  };

  const status = statusConfig[statusAssinatura];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-5 md:px-6 shrink-0">
      {/* Esquerda: hamburger + nome da página */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
          {pageName}
        </h1>

        <span className={`hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Direita: upgrade CTA + notificações + tema */}
      <div className="flex items-center gap-2">
        {statusAssinatura === "trial" && (
          <button
            type="button"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assinar agora</span>
          </button>
        )}

        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
