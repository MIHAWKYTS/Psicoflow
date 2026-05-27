"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  userRole?: "psicologo" | "secretaria" | "admin";
}

export default function DashboardSidebar({ userRole = "psicologo" }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
    { name: "Rotina", href: "/dashboard/rotina", icon: CheckSquare },
    { name: "Casos", href: "/dashboard/casos", icon: FolderKanban },
    {
      name: "Prontuários",
      href: "/dashboard/prontuarios",
      icon: FileText,
      restricted: true,
    },
    {
      name: "Financeiro",
      href: "/dashboard/financeiro",
      icon: DollarSign,
      restricted: true,
    },
    { name: "Engajamento", href: "/dashboard/engajamento", icon: MessageSquare },
    { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen shrink-0 transition-all duration-300">
      {/* Logotipo e Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-sky-500/20">
          Ψ
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-850 dark:text-white leading-none">
            PsicoFlow
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            SaaS Multi-Tenant
          </span>
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          // Esconder menus restritos se o perfil for secretária
          if (item.restricted && userRole === "secretaria") {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                isActive
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
              {item.restricted && (
                <Shield className="w-3.5 h-3.5 ml-auto text-slate-400 dark:text-slate-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Informações do Usuário & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-350">
            {userRole === "psicologo" || userRole === "admin" ? "PA" : "SC"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {userRole === "psicologo" || userRole === "admin" ? "Dr. Psicólogo" : "Secretária"}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold capitalize">
              {userRole === "admin"
                ? "Admin Global"
                : userRole === "psicologo"
                  ? "Administrador"
                  : "Secretária"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
