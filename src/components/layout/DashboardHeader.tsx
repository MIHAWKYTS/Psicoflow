"use client";

import ThemeToggle from "../ThemeToggle";
import { Bell, Sparkles, Menu } from "lucide-react";

interface HeaderProps {
  nomeClinica?: string;
  statusAssinatura?: "trial" | "ativo" | "inadimplente" | "cancelado";
  dataFimTrial?: string;
  onMenuToggle?: () => void;
}

export default function DashboardHeader({
  nomeClinica = "Minha Clínica",
  statusAssinatura = "trial",
  dataFimTrial,
  onMenuToggle,
}: HeaderProps) {
  const daysLeft =
    statusAssinatura === "trial" && dataFimTrial
      ? Math.max(0, Math.ceil((new Date(dataFimTrial).getTime() - Date.now()) / 86_400_000))
      : null;

  const statusBadges = {
    trial:
      daysLeft !== null && daysLeft <= 3
        ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
        : "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
    ativo: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    inadimplente: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-450",
    cancelado: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
  };

  const trialLabel =
    daysLeft !== null
      ? `Trial – ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
      : "Free Trial (15 dias)";

  const statusLabels = {
    trial: trialLabel,
    ativo: "Plano Ativo",
    inadimplente: "Inadimplente 💳",
    cancelado: "Assinatura Cancelada",
  };

  return (
    <header className="h-16 border-b border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6 transition-all duration-300">
      {/* Botão hamburger (mobile) + Informações da clínica */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all shadow-sm focus:outline-none"
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-none">
          {nomeClinica}
        </h1>
        <span
          className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${
            statusBadges[statusAssinatura]
          }`}
        >
          {statusLabels[statusAssinatura]}
        </span>
      </div>

      {/* Controles do Usuário e Tema */}
      <div className="flex items-center gap-3.5">
        {statusAssinatura === "trial" && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assine para garantir acesso permanente</span>
          </div>
        )}

        {/* Notificações */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all shadow-sm focus:outline-none"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        {/* Alternador de Tema */}
        <ThemeToggle />
      </div>
    </header>
  );
}
