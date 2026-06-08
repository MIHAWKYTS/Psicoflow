"use client";

import { useState, useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Trash2,
  User,
  DollarSign,
  FileText,
  CalendarDays,
  Sparkles,
  Loader2 as Loader,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────────

interface Patient {
  id: string;
  nome: string;
  telefoneWhatsapp?: string | null;
  valorSessaoPadrao?: number | null;
}

interface Session {
  id: string;
  tenantId: string;
  patientId: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: "agendada" | "realizada" | "cancelada" | "falta";
  lembreteEnviado: boolean;
  patient: Patient;
}

function normalizeSession(s: any): Session {
  return {
    ...s,
    patient: {
      ...s.patient,
      valorSessaoPadrao:
        s.patient?.valorSessaoPadrao != null
          ? parseFloat(String(s.patient.valorSessaoPadrao))
          : null,
    },
  };
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────

export default function AgendaPage() {
  // ─── ESTADOS ──────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Sidebar (Drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"view" | "create">("view");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarError, setSidebarError] = useState("");

  // Formulário de criação
  const [formPatientId, setFormPatientId] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formStatus, setFormStatus] = useState<"agendada" | "realizada" | "cancelada" | "falta">("agendada");

  // Modal de lembretes em massa
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderDone, setReminderDone] = useState(false);
  const [reminderProgress, setReminderProgress] = useState<{
    sent: number;
    skipped: number;
    total: number;
    status: string;
    error?: string;
  } | null>(null);

  // ─── CALENDÁRIO ───────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMonth]
  );

  // ─── FETCH PACIENTES (uma vez) ────────────────────────────
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch("/api/patients?status=ativo&limit=500");
        const data = await res.json();
        const list: Patient[] = (data.data?.items || []).map((p: any) => ({
          id: p.id,
          nome: p.nome,
          telefoneWhatsapp: p.telefoneWhatsapp ?? null,
          valorSessaoPadrao:
            p.valorSessaoPadrao != null ? parseFloat(String(p.valorSessaoPadrao)) : null,
        }));
        setPatients(list);
        if (list.length > 0) setFormPatientId(list[0].id);
      } catch {
        console.error("Erro ao buscar pacientes");
      }
    }
    fetchPatients();
  }, []);

  // ─── FETCH SESSÕES (por mês) ──────────────────────────────
  useEffect(() => {
    const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

    async function fetchSessions() {
      setLoadingSessions(true);
      try {
        const params = new URLSearchParams({
          inicio: calStart.toISOString(),
          fim: calEnd.toISOString(),
        });
        const res = await fetch(`/api/sessions?${params}`);
        const data = await res.json();
        setSessions((data.data || []).map(normalizeSession));
      } catch {
        console.error("Erro ao buscar sessões");
      } finally {
        setLoadingSessions(false);
      }
    }
    fetchSessions();
  }, [currentMonth]);

  // ─── FILTRAGEM ────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.patient.nome.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "todos" || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, filterStatus]);

  const todayAgendadas = useMemo(() => {
    const today = new Date();
    return sessions.filter(
      (s) => s.status === "agendada" && isSameDay(parseISO(s.dataHoraInicio), today)
    );
  }, [sessions]);

  // ─── NAVEGAÇÃO DE MÊS ────────────────────────────────────
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // ─── SIDEBAR ─────────────────────────────────────────────
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormStatus("agendada");
    setSidebarError("");
    setSidebarMode("create");
    setIsSidebarOpen(true);
  };

  const handleSessionClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setSelectedSession(session);
    setSidebarMode("view");
    setIsSidebarOpen(true);
  };

  // ─── CRIAR AGENDAMENTO ────────────────────────────────────
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formPatientId) return;

    const [startH, startM] = formStartTime.split(":").map(Number);
    const [endH, endM] = formEndTime.split(":").map(Number);

    const startISO = new Date(selectedDate);
    startISO.setHours(startH, startM, 0, 0);

    const endISO = new Date(selectedDate);
    endISO.setHours(endH, endM, 0, 0);

    setSaving(true);
    setSidebarError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formPatientId,
          dataHoraInicio: startISO.toISOString(),
          dataHoraFim: endISO.toISOString(),
          status: formStatus,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSidebarError(data.error || "Erro ao agendar.");
        return;
      }

      setSessions((prev) => [...prev, normalizeSession(data.data)]);
      setIsSidebarOpen(false);
    } catch {
      setSidebarError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // ─── ATUALIZAR STATUS (optimistic) ───────────────────────
  const handleUpdateStatus = async (
    newStatus: "agendada" | "realizada" | "cancelada" | "falta"
  ) => {
    if (!selectedSession) return;

    const prevSessions = sessions;
    const prevSelected = selectedSession;

    setSessions(sessions.map((s) =>
      s.id === selectedSession.id ? { ...s, status: newStatus } : s
    ));
    setSelectedSession({ ...selectedSession, status: newStatus });

    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedSession.patientId,
          dataHoraInicio: selectedSession.dataHoraInicio,
          dataHoraFim: selectedSession.dataHoraFim,
          status: newStatus,
        }),
      });
      if (!res.ok) {
        setSessions(prevSessions);
        setSelectedSession(prevSelected);
      }
    } catch {
      setSessions(prevSessions);
      setSelectedSession(prevSelected);
    }
  };

  // ─── EXCLUIR AGENDAMENTO (optimistic) ────────────────────
  const handleDeleteAppointment = async () => {
    if (!selectedSession) return;

    const prevSessions = sessions;
    const prevSelected = selectedSession;

    setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
    setIsSidebarOpen(false);
    setSelectedSession(null);

    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, { method: "DELETE" });
      if (!res.ok) {
        setSessions(prevSessions);
        setIsSidebarOpen(true);
        setSelectedSession(prevSelected);
      }
    } catch {
      setSessions(prevSessions);
      setIsSidebarOpen(true);
      setSelectedSession(prevSelected);
    }
  };

  // ─── LEMBRETES EM MASSA ───────────────────────────────────
  const handleOpenReminderModal = () => {
    setReminderProgress(null);
    setReminderDone(false);
    setShowReminderModal(true);
  };

  const handleSendReminders = async () => {
    setReminderSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-reminders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setReminderProgress({
          sent: 0,
          skipped: 0,
          total: 0,
          status: "error",
          error: data.error || "Erro ao iniciar envio.",
        });
        setReminderSending(false);
        return;
      }
      const { jobId, total } = data.data;
      setReminderProgress({ sent: 0, skipped: 0, total, status: "running" });
      const interval = setInterval(async () => {
        try {
          const poll = await fetch(`/api/whatsapp/reminder-status?jobId=${jobId}`);
          const pollData = await poll.json();
          const job = pollData.data;
          setReminderProgress(job);
          if (job.status === "done" || job.status === "error") {
            clearInterval(interval);
            setReminderSending(false);
            setReminderDone(true);
          }
        } catch {
          clearInterval(interval);
          setReminderSending(false);
        }
      }, 2000);
    } catch {
      setReminderProgress({
        sent: 0,
        skipped: 0,
        total: 0,
        status: "error",
        error: "Erro de conexão.",
      });
      setReminderSending(false);
    }
  };

  // ─── ESTILOS DE STATUS ────────────────────────────────────
  const statusConfig = {
    agendada: {
      pill: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-100/50 dark:hover:bg-sky-950/50",
      dot: "bg-sky-500",
      label: "Agendada",
      badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
    },
    realizada: {
      pill: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50",
      dot: "bg-emerald-500",
      label: "Realizada",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    },
    falta: {
      pill: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/50",
      dot: "bg-amber-500",
      label: "Falta",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    },
    cancelada: {
      pill: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-100/50 dark:hover:bg-rose-950/50",
      dot: "bg-rose-500",
      label: "Cancelada",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    },
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── CABEÇALHO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:bg-sky-500/5">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              Agenda Mensal
            </h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Gerencie atendimentos, controle presenças, faltas e agende novas sessões clicando diretamente nos dias.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenReminderModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              Lembretes do Dia
              {todayAgendadas.length > 0 && ` (${todayAgendadas.length})`}
            </span>
          </button>
          <button
            onClick={() => handleDayClick(new Date())}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* ─── BARRA DE CONTROLES ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 transition-all duration-300">
        {/* Navegação de Mês */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base capitalize px-2 leading-none">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>

          <button
            onClick={handleToday}
            className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-white transition-all cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Busca e Filtro */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer font-semibold"
            >
              <option value="todos">Todos Status</option>
              <option value="agendada">Agendadas</option>
              <option value="realizada">Realizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="falta">Faltas</option>
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400 w-0 h-0" />
          </div>
        </div>
      </div>

      {/* ─── CALENDÁRIO MENSAL ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-300 relative">
        {/* Loading overlay */}
        {loadingSessions && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
            <Loader className="w-6 h-6 text-sky-500 animate-spin" />
          </div>
        )}

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 py-3 text-center">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
            <div
              key={label}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-150 dark:divide-slate-800 bg-slate-150/40 dark:bg-slate-800/20">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            const daySessions = filteredSessions.filter((session) =>
              isSameDay(parseISO(session.dataHoraInicio), day)
            );
            const sortedSessions = [...daySessions].sort(
              (a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime()
            );

            return (
              <div
                key={day.toString() + idx}
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] bg-white dark:bg-slate-900 p-2 flex flex-col gap-1.5 transition-all select-none relative group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/40 ${
                  !isCurrentMonth ? "bg-slate-50/40 dark:bg-slate-950/10 opacity-40" : ""
                } ${
                  isDayToday ? "ring-2 ring-sky-500 ring-inset dark:ring-sky-500 bg-sky-500/[0.01]" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  {isDayToday ? (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-sky-500 text-white tracking-wider">
                      Hoje
                    </span>
                  ) : (
                    <div />
                  )}
                  <span
                    className={`text-xs font-extrabold px-1.5 py-0.5 rounded-lg ${
                      isDayToday ? "text-sky-500" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar">
                  {sortedSessions.map((session) => {
                    const hora = format(parseISO(session.dataHoraInicio), "HH:mm");
                    const cfg = statusConfig[session.status];

                    return (
                      <div
                        key={session.id}
                        onClick={(e) => handleSessionClick(e, session)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all truncate shadow-sm shrink-0 leading-none ${cfg.pill}`}
                        title={`${hora} - ${session.patient.nome} (${cfg.label})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                        <span className="text-[9px] opacity-80 shrink-0 font-extrabold">{hora}</span>
                        <span className="truncate flex-1">{session.patient.nome}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-500 border border-sky-200/40 dark:border-sky-900/30 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LEGENDA ─── */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-2">
        <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mr-2">
          Legenda:
        </span>
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── MODAL DE LEMBRETES EM MASSA ─── */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !reminderSending && setShowReminderModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-none">
                    Lembretes do Dia
                  </h3>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-snug">
                  Envia uma mensagem de confirmação no WhatsApp para cada paciente agendado hoje.
                </p>
              </div>
              {!reminderSending && (
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
              {todayAgendadas.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                    Nenhum paciente agendado para hoje.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {todayAgendadas.length} paciente{todayAgendadas.length > 1 ? "s" : ""} receberão a mensagem:
                  </p>
                  {todayAgendadas.map((s) => (
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
                  onClick={() => setShowReminderModal(false)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowReminderModal(false)}
                    disabled={reminderSending}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReminders}
                    disabled={reminderSending || todayAgendadas.length === 0}
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
      )}

      {/* ─── SIDEBAR DESLIZANTE (DRAWER) ─── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-800 transition-all duration-300 animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-none">
                  {sidebarMode === "view" ? "Detalhamento da Consulta" : "Agendar Atendimento"}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-none">
                  {sidebarMode === "view"
                    ? "Informações clínicas e alteração de presença."
                    : `Cadastrar sessão para o dia ${format(selectedDate!, "dd/MM/yyyy")}`}
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sidebarMode === "view" && selectedSession ? (
                // ─── DETALHES DA SESSÃO ───
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 text-xs font-bold border rounded-full uppercase tracking-wider ${
                        statusConfig[selectedSession.status].badge
                      }`}
                    >
                      {statusConfig[selectedSession.status].label}
                    </span>
                    {selectedSession.lembreteEnviado && (
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Lembrete Enviado
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-base shrink-0">
                      {selectedSession.patient.nome.charAt(0)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate leading-snug">
                        {selectedSession.patient.nome}
                      </h4>
                      {selectedSession.patient.telefoneWhatsapp && (
                        <p className="text-xs text-slate-400 font-semibold">
                          {selectedSession.patient.telefoneWhatsapp}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Horário
                      </span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>
                          {format(parseISO(selectedSession.dataHoraInicio), "HH:mm")} -{" "}
                          {format(parseISO(selectedSession.dataHoraFim), "HH:mm")}
                        </span>
                      </div>
                    </div>
                    {selectedSession.patient.valorSessaoPadrao != null && (
                      <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Valor Combinado
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span>R$ {selectedSession.patient.valorSessaoPadrao.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alterar Status */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Alterar Presença / Status:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            status: "agendada",
                            label: "Agendada",
                            color:
                              "hover:border-sky-500 hover:text-sky-500 text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/5",
                          },
                          {
                            status: "realizada",
                            label: "Realizada",
                            color:
                              "hover:border-emerald-500 hover:text-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                          },
                          {
                            status: "falta",
                            label: "Falta",
                            color:
                              "hover:border-amber-500 hover:text-amber-500 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5",
                          },
                          {
                            status: "cancelada",
                            label: "Cancelada",
                            color:
                              "hover:border-rose-500 hover:text-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5",
                          },
                        ] as const
                      ).map((btn) => {
                        const isSel = selectedSession.status === btn.status;
                        return (
                          <button
                            key={btn.status}
                            onClick={() => handleUpdateStatus(btn.status)}
                            className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                              isSel
                                ? btn.color + " ring-1 ring-inset"
                                : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* WhatsApp individual */}
                  {selectedSession.patient.telefoneWhatsapp && (
                    <div className="pt-2">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${selectedSession.patient.telefoneWhatsapp}&text=Ol%C3%A1%20${encodeURIComponent(
                          selectedSession.patient.nome
                        )}!%20Passando%20para%20confirmar%20nossa%20sess%C3%A3o%20de%20psicologia%20agendada%20para%20o%20dia%20${format(
                          parseISO(selectedSession.dataHoraInicio),
                          "dd/MM"
                        )}%20%C3%A0s%20${format(
                          parseISO(selectedSession.dataHoraInicio),
                          "HH:mm"
                        )}.%20At%C3%A9%20l%C3%A1!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                        <span>Confirmar por WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                // ─── FORMULÁRIO DE CRIAÇÃO ───
                <form onSubmit={handleCreateAppointment} className="space-y-5">
                  {sidebarError && (
                    <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
                      {sidebarError}
                    </div>
                  )}

                  {/* Paciente */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Selecione o Paciente:
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-450" />
                      <select
                        value={formPatientId}
                        onChange={(e) => setFormPatientId(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-3 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none font-semibold cursor-pointer"
                      >
                        {patients.length === 0 ? (
                          <option value="">Carregando pacientes...</option>
                        ) : (
                          patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                              {p.valorSessaoPadrao != null
                                ? ` (R$ ${p.valorSessaoPadrao.toFixed(2)})`
                                : ""}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-3.5 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400 w-0 h-0" />
                    </div>
                  </div>

                  {/* Horários */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Hora Início:
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-455" />
                        <input
                          type="time"
                          value={formStartTime}
                          onChange={(e) => setFormStartTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold cursor-text"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Hora Término:
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-455" />
                        <input
                          type="time"
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold cursor-text"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Inicial */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Status da Consulta:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["agendada", "realizada", "falta", "cancelada"] as const).map((st) => {
                        const isSel = formStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFormStatus(st)}
                            className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isSel
                                ? "bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400 ring-1 ring-inset"
                                : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            <span className="capitalize">{st}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || patients.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        "Agendar Consulta"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer — ações destrutivas */}
            {sidebarMode === "view" && selectedSession && (
              <div className="p-5 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  onClick={handleDeleteAppointment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Agendamento</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
