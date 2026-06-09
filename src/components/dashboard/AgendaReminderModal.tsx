"use client";

import { format, parseISO } from "date-fns";
import {
  X,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  CalendarDays,
  Loader2 as Loader,
} from "lucide-react";

interface Session {
  id: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  lembreteEnviado: boolean;
  patient: { nome: string };
}

type ReminderProgress = {
  sent: number;
  skipped: number;
  total: number;
  status: string;
  error?: string;
} | null;

interface AgendaReminderModalProps {
  onClose: () => void;
  reminderSending: boolean;
  reminderDone: boolean;
  reminderDate: string;
  setReminderDate: (date: string) => void;
  setReminderProgress: (p: ReminderProgress) => void;
  fetchReminderSessions: (date: string) => void;
  reminderLoadingSessions: boolean;
  reminderSessions: Session[];
  reminderProgress: ReminderProgress;
  handleSendReminders: () => void;
}

export default function AgendaReminderModal({
  onClose,
  reminderSending,
  reminderDone,
  reminderDate,
  setReminderDate,
  setReminderProgress,
  fetchReminderSessions,
  reminderLoadingSessions,
  reminderSessions,
  reminderProgress,
  handleSendReminders,
}: AgendaReminderModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !reminderSending && onClose()}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-none">
                Lembretes
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-snug">
              Envia confirmação no WhatsApp para cada paciente agendado no dia selecionado.
            </p>
            <div className="mt-3">
              <input
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={reminderDate}
                disabled={reminderSending}
                onChange={(e) => {
                  setReminderDate(e.target.value);
                  setReminderProgress(null);
                  fetchReminderSessions(e.target.value);
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>
          {!reminderSending && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
          {reminderLoadingSessions ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : reminderSessions.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                Nenhum paciente agendado para este dia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {reminderSessions.length} paciente{reminderSessions.length > 1 ? "s" : ""} receberão a mensagem:
              </p>
              {reminderSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                    {s.patient.nome.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {s.patient.nome}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {format(parseISO(s.dataHoraInicio), "HH:mm")} –{" "}
                      {format(parseISO(s.dataHoraFim), "HH:mm")}
                    </p>
                  </div>
                  {s.lembreteEnviado && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                      Já enviado
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {reminderProgress && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                reminderProgress.status === "error"
                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30"
                  : reminderProgress.status === "done"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30"
                  : "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30"
              }`}
            >
              {reminderProgress.status === "error" ? (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {reminderProgress.error || "Erro ao enviar."}
                </p>
              ) : reminderProgress.status === "done" ? (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Concluído! {reminderProgress.sent} enviado
                  {reminderProgress.sent !== 1 ? "s" : ""}
                  {reminderProgress.skipped > 0 &&
                    `, ${reminderProgress.skipped} ignorado${reminderProgress.skipped !== 1 ? "s" : ""}`}
                  .
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                    <span className="flex items-center gap-2">
                      <Loader className="w-3.5 h-3.5 animate-spin shrink-0" />
                      Enviando mensagens...
                    </span>
                    <span>
                      {reminderProgress.sent}/{reminderProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-sky-200 dark:bg-sky-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          reminderProgress.total > 0
                            ? (reminderProgress.sent / reminderProgress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {reminderDone ? (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={reminderSending}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendReminders}
                disabled={reminderSending || reminderSessions.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reminderSending ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    Confirmar e Enviar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
