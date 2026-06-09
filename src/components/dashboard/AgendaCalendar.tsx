"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  format,
  isSameDay,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import dynamic from "next/dynamic";

const SessionDetailsSidebar = dynamic(() => import("./SessionDetailsSidebar"), { ssr: false });

type Session = {
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
};

type ReminderJob = {
  jobId: string;
  total: number;
  sent: number;
  skipped: number;
  status: "running" | "done" | "error";
  error?: string;
};

const statusThemes: Record<string, string> = {
  agendada: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-100/50 dark:hover:bg-sky-950/40",
  realizada: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40",
  cancelada: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-100/50 dark:hover:bg-rose-950/40",
  falta: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/40",
};

const dotColors: Record<string, string> = {
  agendada: "bg-sky-500",
  realizada: "bg-emerald-500",
  cancelada: "bg-rose-500",
  falta: "bg-amber-500",
};

export default function AgendaCalendar() {
  const [view, setView] = useState<"semana" | "mes">("semana");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [reminderJob, setReminderJob] = useState<ReminderJob | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPeriodBounds = useCallback(() => {
    if (view === "semana") {
      return {
        inicio: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        fim: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      };
    }
    return {
      inicio: startOfMonth(referenceDate),
      fim: endOfMonth(referenceDate),
    };
  }, [view, referenceDate]);

  useEffect(() => {
    const { inicio, fim } = getPeriodBounds();
    setLoading(true);
    fetch(`/api/sessions?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSessions(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [getPeriodBounds]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const periodLabel = () => {
    if (view === "semana") {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
      return `${format(start, "dd/MM")} a ${format(end, "dd/MM/yyyy")}`;
    }
    const label = format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const navigate = (dir: 1 | -1) => {
    setReferenceDate((prev) =>
      view === "semana"
        ? dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)
        : dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const today = new Date();
  const todayAgendadas = sessions.filter(
    (s) => s.status === "agendada" && isSameDay(new Date(s.dataHoraInicio), today)
  );
  const pendingReminders = todayAgendadas.filter((s) => !s.lembreteEnviado);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.patient.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCardClick = (session: Session) => {
    setSelectedSession(session);
    setIsSidebarOpen(true);
  };

  const handleStatusChange = (newStatus: "agendada" | "realizada" | "cancelada" | "falta") => {
    if (!selectedSession) return;
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: newStatus } : s));
    setSelectedSession((prev) => prev ? { ...prev, status: newStatus } : prev);
  };

  const startPoll = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/reminder-status?jobId=${jobId}`);
        const d = await res.json();
        if (d.success) {
          setReminderJob((prev) => prev ? { ...prev, ...d.data } : null);
          if (d.data.status === "done" || d.data.status === "error") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setSendingReminders(false);
            // Refresh sessions to reflect updated lembreteEnviado
            const { inicio, fim } = getPeriodBounds();
            fetch(`/api/sessions?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
              .then((r) => r.json())
              .then((rd) => { if (rd.success) setSessions(rd.data ?? []); })
              .catch(() => {});
          }
        }
      } catch { /* ignore */ }
    }, 2000);
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderJob(null);
    try {
      const res = await fetch("/api/whatsapp/send-reminders", { method: "POST" });
      const d = await res.json();
      if (res.ok && d.data?.jobId) {
        setReminderJob({ jobId: d.data.jobId, total: d.data.total, sent: 0, skipped: 0, status: "running" });
        startPoll(d.data.jobId);
      } else {
        setReminderJob({ jobId: "", total: 0, sent: 0, skipped: 0, status: "error", error: d.error ?? "Erro ao iniciar envio." });
        setSendingReminders(false);
      }
    } catch {
      setReminderJob({ jobId: "", total: 0, sent: 0, skipped: 0, status: "error", error: "Erro de conexão." });
      setSendingReminders(false);
    }
  };

  // Week view: Mon–Fri
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Month view: offset + all days
  const monthStart = startOfMonth(referenceDate);
  const totalDays = endOfMonth(referenceDate).getDate();
  const firstDayOffset = getDay(monthStart); // 0=Sun
  const monthCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => addDays(monthStart, i)),
  ];

  return (
    <div className="space-y-6">
      {/* Reminder banner */}
      {reminderJob && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border ${
            reminderJob.status === "done"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
              : reminderJob.status === "error"
              ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
              : "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30"
          }`}
        >
          {reminderJob.status === "done" && <CheckCircle className="w-4 h-4 shrink-0" />}
          {reminderJob.status === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
          {reminderJob.status === "running" && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
          <span>
            {reminderJob.status === "running" &&
              `Enviando ${reminderJob.sent} de ${reminderJob.total}...`}
            {reminderJob.status === "done" &&
              `Lembretes enviados! ${reminderJob.sent} enviados, ${reminderJob.skipped} ignorados.`}
            {reminderJob.status === "error" &&
              (reminderJob.error ?? "Erro ao enviar lembretes.")}
          </span>
          <button
            onClick={() => setReminderJob(null)}
            className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controles */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setView("semana")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              view === "semana"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView("mes")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              view === "mes"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Mês
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
            >
              <option value="todos">Todos Status</option>
              <option value="agendada">Agendadas</option>
              <option value="realizada">Realizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="falta">Faltas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid da Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-sky-500 shrink-0" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">
              {periodLabel()}
            </h2>
            {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            {todayAgendadas.length > 0 && (
              <button
                onClick={handleSendReminders}
                disabled={sendingReminders || pendingReminders.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                {sendingReminders
                  ? "Enviando..."
                  : pendingReminders.length === 0
                  ? "Lembretes enviados hoje"
                  : `Enviar Lembretes do Dia (${pendingReminders.length})`}
              </button>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Semana */}
        {view === "semana" ? (
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
            {weekDays.map((day) => {
              const sessoesDoDia = filteredSessions.filter((s) =>
                isSameDay(new Date(s.dataHoraInicio), day)
              );
              const dayLabel = format(day, "EEE (dd/MM)", { locale: ptBR });
              const capitalDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

              return (
                <div key={day.toISOString()} className="p-4 min-h-[400px] flex flex-col space-y-3">
                  <div className="pb-2 border-b border-slate-200/65 dark:border-slate-800">
                    <span className={`text-sm font-semibold ${
                      isSameDay(day, today)
                        ? "text-sky-600 dark:text-white"
                        : "text-slate-800 dark:text-white"
                    }`}>
                      {capitalDay}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-300 block mt-0.5">
                      {sessoesDoDia.length} sessões
                    </span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {sessoesDoDia.length > 0 ? (
                      sessoesDoDia.map((session) => {
                        const hora = new Date(session.dataHoraInicio).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Sao_Paulo",
                        });
                        return (
                          <div
                            key={session.id}
                            onClick={() => handleCardClick(session)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${statusThemes[session.status]}`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {hora}
                              </span>
                              <span className={`w-2.5 h-2.5 rounded-full ${dotColors[session.status]}`} />
                            </div>
                            <h4 className="text-xs font-bold leading-snug tracking-tight truncate">
                              {session.patient.nome}
                            </h4>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <span className="text-xs text-slate-400 text-center">Nenhuma sessão agendada</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mês */
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const temSessoes = filteredSessions.some((s) =>
                  isSameDay(new Date(s.dataHoraInicio), day)
                );
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square p-1.5 border rounded-lg flex flex-col justify-between items-center transition-all ${
                      isToday
                        ? "border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/20"
                        : "border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900"
                    } ${temSessoes ? "ring-2 ring-sky-500/10" : ""}`}
                  >
                    <span className={`text-xs font-bold ${
                      isToday ? "text-sky-600 dark:text-white" : "text-slate-600 dark:text-white"
                    }`}>
                      {day.getDate()}
                    </span>
                    {temSessoes && (
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!loading && filteredSessions.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">
                Nenhuma sessão neste período
              </p>
            )}
          </div>
        )}
      </div>

      <SessionDetailsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        session={selectedSession}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
