"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Users2,
  FileText,
  DollarSign,
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

type SidebarRole = UserRole | "admin" | "psicologo" | "psicologo_admin";

interface SidebarProps {
  userRole: SidebarRole;
  userName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: "Psicólogo(a)",
  psicologo: "Psicólogo(a)",
  psicologo_admin: "Psicólogo(a)",
  secretaria: "Secretária(o)",
};

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Usuário";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return initials.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";
}

const navSections = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard",   href: "/dashboard",            icon: LayoutDashboard },
      { name: "Agenda",      href: "/dashboard/agenda",     icon: Calendar },
      { name: "Pacientes",   href: "/dashboard/pacientes",  icon: Users },
    ],
  },
  {
    label: "Clínica",
    items: [
      { name: "Prontuários", href: "/dashboard/prontuarios", icon: FileText,      restricted: true },
      { name: "Casos",       href: "/dashboard/casos",       icon: FolderKanban },
      { name: "Rotina",      href: "/dashboard/rotina",      icon: CheckSquare },
    ],
  },
  {
    label: "Gestão",
    items: [
      { name: "Equipe",         href: "/dashboard/equipe",         icon: Users2,       adminOnly: true },
      { name: "Financeiro",     href: "/dashboard/financeiro",     icon: DollarSign },
      { name: "Engajamento",    href: "/dashboard/engajamento",    icon: MessageSquare },
      { name: "Configurações",  href: "/dashboard/configuracoes",  icon: Settings,     adminOnly: true },
    ],
  },
];

export default function DashboardSidebar({
  userRole,
  userName,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const firstName = getFirstName(userName);
  const initials = getInitials(userName);
  const roleLabel = roleLabels[userRole] ?? "Psicólogo(a)";

  useEffect(() => {
    if (onClose) onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  return (
    <aside
      className={`
        w-64 bg-slate-950 flex flex-col h-screen shrink-0
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 lg:z-auto
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/30 shrink-0">
          Ψ
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-white text-sm tracking-tight">PsiGen</span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
            Gestão Clínica
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if ((item as any).restricted && userRole === "secretaria") return false;
            if ((item as any).adminOnly && userRole !== "psicologo_admin") return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                        transition-all duration-150 cursor-pointer
                        ${isActive
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }
                      `}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full" />
                      )}
                      <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                      <span className="flex-1">{item.name}</span>
                      {(item as any).restricted && (
                        <Shield className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Perfil do usuário */}
      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 ring-2 ring-slate-700">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">{firstName}</span>
            <span className="text-[10px] text-slate-500 font-medium">{roleLabel}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
