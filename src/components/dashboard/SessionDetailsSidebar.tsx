"use client";

import { useEffect } from "react";
import { X, Calendar, Clock, User, Phone, DollarSign, MessageSquare, ShieldAlert } from "lucide-react";
import type { SessionInput } from "@/lib/validations";

interface SessionDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    dataHoraInicio: string;
    dataHoraFim: string;
    status: "agendada" | "realizada" | "cancelada" | "falta";
    lembreteEnviado: boolean;
    patient: {
      id: string;
      nome: string;
      telefoneWhatsapp?: string;
      valorSessaoPadrao?: number;
    };
  } | null;
  onStatusChange: (status: "agendada" | "realizada" | "cancelada" | "falta") => void;
}

export default function SessionDetailsSidebar({
  isOpen,
  onClose,
  session,
  onStatusChange,
}: SessionDetailsSidebarProps) {
  // Evitar scroll no body quando o painel estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!session) return null;

  const dataInicio = new Date(session.dataHoraInicio);
  const dataFim = new Date(session.dataHoraFim);

  const formatData = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatHora = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors = {
    agendada: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50",
    realizada: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    cancelada: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
    falta: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  };

  const statusLabels = {
    agendada: "Agendada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    falta: "Falta",
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? "visible" : "invisible pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Painel lateral deslizante */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-slate-100 dark:border-slate-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header da Sidebar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                statusColors[session.status]
              }`}
            >
              {statusLabels[session.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo da Sidebar */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Principal do Paciente */}
          <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              {session.patient.nome.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                {session.patient.nome}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {session.patient.telefoneWhatsapp || "Sem telefone"}
              </p>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Data e Horário
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span className="text-sm capitalize font-medium">{formatData(dataInicio)}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">
                  {formatHora(dataInicio)} - {formatHora(dataFim)}
                </span>
              </div>
            </div>
          </div>

          {/* Financeiro Rápido */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Valor da Sessão
            </h4>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                R$ {session.patient.valorSessaoPadrao?.toFixed(2) || "0,00"}
              </span>
            </div>
          </div>

          {/* Níveis de Acesso e LGPD Info */}
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider">
                Segurança LGPD
              </h5>
              <p className="text-xs leading-relaxed">
                Prontuários clínicos e transações financeiras são bloqueados para o perfil <strong>secretária</strong>. Apenas o psicólogo administrador tem acesso total.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações Rápidas */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onStatusChange("realizada")}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all text-center hover:shadow active:scale-98"
            >
              Marcar Realizada
            </button>
            <button
              onClick={() => onStatusChange("falta")}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition-all text-center active:scale-98"
            >
              Marcar Falta
            </button>
          </div>
          
          <button
            onClick={() => onStatusChange("cancelada")}
            className="w-full px-4 py-2.5 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium text-sm rounded-xl transition-all active:scale-98"
          >
            Cancelar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
