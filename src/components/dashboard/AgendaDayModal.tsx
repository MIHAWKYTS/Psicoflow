"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Clock } from "lucide-react";

type Session = {
  id: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: "agendada" | "realizada" | "cancelada" | "falta";
  lembreteEnviado: boolean;
  patient: { id: string; nome: string };
};

const statusDot: Record<string, string> = {
  agendada:  "bg-indigo-500",
  realizada: "bg-emerald-500",
  cancelada: "bg-rose-500",
  falta:     "bg-amber-500",
};

const statusLabel: Record<string, string> = {
  agendada:  "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  falta:     "Falta",
};

interface AgendaDayModalProps {
  day: Date;
  sessions: Session[];
  onClose: () => void;
  onSelectSession: (session: Session) => void;
}

export default function AgendaDayModal({ day, sessions, onClose, onSelectSession }: AgendaDayModalProps) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime()
  );

  const dayLabel = format(day, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight">
              {capitalLabel}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {sorted.length} sessão{sorted.length !== 1 ? "ões" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
          {sorted.map((session) => {
            const inicio = new Date(session.dataHoraInicio).toLocaleTimeString("pt-BR", {
              hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
            });
            const fim = new Date(session.dataHoraFim).toLocaleTimeString("pt-BR", {
              hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
            });

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 w-24 shrink-0">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {inicio}–{fim}
                  </span>
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {session.patient.nome}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${statusDot[session.status]}`} />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {statusLabel[session.status]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
