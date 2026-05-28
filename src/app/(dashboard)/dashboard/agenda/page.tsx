"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Loader2,
} from "lucide-react";

// ─── DEFINIÇÕES E TIPAGENS ───────────────────────────────────

interface PatientMock {
  id: string;
  nome: string;
  telefoneWhatsapp: string;
  valorSessaoPadrao: number;
}

interface SessionMock {
  id: string;
  tenantId: string;
  patientId: string;
  dataHoraInicio: string; // ISO String
  dataHoraFim: string; // ISO String
  status: "agendada" | "realizada" | "cancelada" | "falta";
  lembreteEnviado: boolean;
  observacoes?: string;
  patient: PatientMock;
}

// ─── DADOS DE MOCK INICIAIS (Modelo Session/Patient Prisma) ──

const MOCK_PATIENTS: PatientMock[] = [
  { id: "p1", nome: "Ana Beatriz Silva", telefoneWhatsapp: "+5511987654321", valorSessaoPadrao: 150.0 },
  { id: "p2", nome: "Carlos Eduardo Costa", telefoneWhatsapp: "+5521998887766", valorSessaoPadrao: 180.0 },
  { id: "p3", nome: "Juliana Santos", telefoneWhatsapp: "+5531977776655", valorSessaoPadrao: 160.0 },
  { id: "p4", nome: "Mariana Souza", telefoneWhatsapp: "+5511955554433", valorSessaoPadrao: 150.0 },
  { id: "p5", nome: "Rodrigo Almeida", telefoneWhatsapp: "+5519966665544", valorSessaoPadrao: 200.0 },
];

const INITIAL_SESSIONS: SessionMock[] = [
  {
    id: "s1",
    tenantId: "t1",
    patientId: "p1",
    dataHoraInicio: "2026-05-20T09:00:00Z",
    dataHoraFim: "2026-05-20T10:00:00Z",
    status: "realizada",
    lembreteEnviado: true,
    observacoes: "Paciente evoluiu bem na discussão sobre ansiedade acadêmica.",
    patient: MOCK_PATIENTS[0],
  },
  {
    id: "s2",
    tenantId: "t1",
    patientId: "p2",
    dataHoraInicio: "2026-05-20T11:30:00Z",
    dataHoraFim: "2026-05-20T12:30:00Z",
    status: "agendada",
    lembreteEnviado: false,
    observacoes: "Primeira sessão após a triagem. Focar em anamnese.",
    patient: MOCK_PATIENTS[1],
  },
  {
    id: "s3",
    tenantId: "t1",
    patientId: "p3",
    dataHoraInicio: "2026-05-20T14:00:00Z",
    dataHoraFim: "2026-05-20T15:00:00Z",
    status: "falta",
    lembreteEnviado: true,
    observacoes: "Paciente não compareceu e não justificou a tempo.",
    patient: MOCK_PATIENTS[2],
  },
  {
    id: "s4",
    tenantId: "t1",
    patientId: "p4",
    dataHoraInicio: "2026-05-21T10:00:00Z",
    dataHoraFim: "2026-05-21T11:00:00Z",
    status: "agendada",
    lembreteEnviado: true,
    observacoes: "Discutir conflito familiar trazido na sessão anterior.",
    patient: MOCK_PATIENTS[3],
  },
  {
    id: "s5",
    tenantId: "t1",
    patientId: "p5",
    dataHoraInicio: "2026-05-21T16:00:00Z",
    dataHoraFim: "2026-05-21T17:00:00Z",
    status: "cancelada",
    lembreteEnviado: false,
    observacoes: "Desmarcado pelo paciente por motivos de trabalho.",
    patient: MOCK_PATIENTS[4],
  },
  {
    id: "s6",
    tenantId: "t1",
    patientId: "p1",
    dataHoraInicio: "2026-05-15T09:00:00Z",
    dataHoraFim: "2026-05-15T10:00:00Z",
    status: "realizada",
    lembreteEnviado: true,
    patient: MOCK_PATIENTS[0],
  },
  {
    id: "s7",
    tenantId: "t1",
    patientId: "p3",
    dataHoraInicio: "2026-05-27T14:00:00Z",
    dataHoraFim: "2026-05-27T15:00:00Z",
    status: "agendada",
    lembreteEnviado: false,
    patient: MOCK_PATIENTS[2],
  },
];

export default function AgendaPage() {
  // ─── ESTADOS PRINCIPAIS ────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 4, 20)); // Maio 2026
  const [sessions, setSessions] = useState<SessionMock[]>(INITIAL_SESSIONS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Estados da Sidebar (Drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"view" | "create">("view");
  const [selectedSession, setSelectedSession] = useState<SessionMock | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estados do Formulário de Criação
  const [formPatientId, setFormPatientId] = useState(MOCK_PATIENTS[0].id);
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formStatus, setFormStatus] = useState<"agendada" | "realizada" | "cancelada" | "falta">("agendada");
  const [formNotes, setFormNotes] = useState("");

  // ─── Estados do Disparo de Lembretes WhatsApp ─────────────────────────────
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderToast, setReminderToast] = useState<{
    type: "progress" | "success" | "error";
    message: string;
  } | null>(null);
  const reminderPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── CÁLCULOS DO CALENDÁRIO MENSAL (date-fns) ───────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Sábado

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // ─── FILTRAGEM E INDEXAÇÃO DAS SESSÕES ─────────────────────
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.patient.nome.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "todos" || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, filterStatus]);

  // Indexação antecipada para evitar loop O(N*D) no calendário
  const sessionsByDate = useMemo(() => {
    const dictionary: Record<string, SessionMock[]> = {};
    filteredSessions.forEach((session) => {
      const dateKey = format(parseISO(session.dataHoraInicio), "yyyy-MM-dd");
      if (!dictionary[dateKey]) {
        dictionary[dateKey] = [];
      }
      dictionary[dateKey].push(session);
    });
    return dictionary;
  }, [filteredSessions]);

  // Navegação de Meses
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date(2026, 4, 20));

  // ─── AÇÕES DA SIDEBAR / AGENDA ─────────────────────────────
  
  // Abrir sidebar para criação de novo agendamento
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormStatus("agendada");
    setFormNotes("");
    setSidebarMode("create");
    setIsSidebarOpen(true);
  };

  // Abrir sidebar para visualizar detalhes
  const handleSessionClick = (e: React.MouseEvent, session: SessionMock) => {
    e.stopPropagation(); // Evita disparar o clique na célula do dia
    setSelectedSession(session);
    setSidebarMode("view");
    setIsSidebarOpen(true);
  };

  // Salvar novo agendamento
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const patient = MOCK_PATIENTS.find((p) => p.id === formPatientId) || MOCK_PATIENTS[0];

    // Monta a string ISO baseada no dia clicado e horários informados
    const [startH, startM] = formStartTime.split(":").map(Number);
    const [endH, endM] = formEndTime.split(":").map(Number);

    const startISO = new Date(selectedDate);
    startISO.setHours(startH, startM, 0, 0);

    const endISO = new Date(selectedDate);
    endISO.setHours(endH, endM, 0, 0);

    const newSession: SessionMock = {
      id: "s_" + Date.now(),
      tenantId: "t1",
      patientId: patient.id,
      dataHoraInicio: startISO.toISOString(),
      dataHoraFim: endISO.toISOString(),
      status: formStatus,
      lembreteEnviado: false,
      observacoes: formNotes,
      patient,
    };

    setSessions((prev) => [...prev, newSession]);
    setIsSidebarOpen(false);
  };

  // Atualizar status de uma sessão existente pela Sidebar
  const handleUpdateStatus = (newStatus: "agendada" | "realizada" | "cancelada" | "falta") => {
    if (!selectedSession) return;
    
    const updated = sessions.map((s) =>
      s.id === selectedSession.id ? { ...s, status: newStatus } : s
    );
    setSessions(updated);
    setSelectedSession({ ...selectedSession, status: newStatus });
  };

  // Excluir agendamento
  const handleDeleteAppointment = () => {
    if (!selectedSession) return;
    
    setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
    setIsSidebarOpen(false);
    setSelectedSession(null);
  };

  // ─── 8.2 — Handler do botão "Disparar Lembretes do Dia" ───────────────────
  const handleSendReminders = useCallback(async () => {
    // 8.7 — Guarda contra duplo clique (já garantido pelo disabled, mas defensive)
    if (isSendingReminders) return;

    setIsSendingReminders(true);
    setReminderToast({ type: "progress", message: "Iniciando disparo de lembretes..." });

    try {
      const res = await fetch("/api/whatsapp/send-reminders", { method: "POST" });
      const json = await res.json();

      // 8.6 — Tratar erros da API (instância desconectada, env ausente)
      if (!res.ok) {
        setReminderToast({
          type: "error",
          message: json.error ?? "Erro ao iniciar o disparo de lembretes.",
        });
        setIsSendingReminders(false);
        return;
      }

      const { jobId, total } = json.data ?? json;

      if (total === 0) {
        setReminderToast({ type: "success", message: "Nenhuma sessão pendente de lembrete hoje." });
        setIsSendingReminders(false);
        setTimeout(() => setReminderToast(null), 4000);
        return;
      }

      // 8.4 — Toast inicial de progresso
      setReminderToast({ type: "progress", message: `Enviando 0 de ${total}...` });

      // 8.3 — Polling a cada 2 segundos
      reminderPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/whatsapp/reminder-status?jobId=${jobId}`
          );
          const statusJson = await statusRes.json();

          if (!statusRes.ok) {
            clearInterval(reminderPollRef.current!);
            setReminderToast({
              type: "error",
              message: statusJson.error ?? "Erro ao verificar progresso.",
            });
            setIsSendingReminders(false);
            return;
          }

          const { sent, total: tot, status: jobStatus } = statusJson;

          if (jobStatus === "running") {
            // 8.4 — Atualizar toast de progresso dinâmico
            setReminderToast({
              type: "progress",
              message: `Enviando ${sent} de ${tot}...`,
            });
          } else if (jobStatus === "done") {
            // 8.5 — Toast de sucesso e encerrar polling
            clearInterval(reminderPollRef.current!);
            setReminderToast({
              type: "success",
              message: `✓ ${sent} lembrete(s) enviado(s) com sucesso!`,
            });
            setIsSendingReminders(false);
            setTimeout(() => setReminderToast(null), 5000);
          } else if (jobStatus === "error") {
            clearInterval(reminderPollRef.current!);
            setReminderToast({
              type: "error",
              message: statusJson.errorMessage ?? "Erro durante o disparo.",
            });
            setIsSendingReminders(false);
          }
        } catch {
          clearInterval(reminderPollRef.current!);
          setReminderToast({
            type: "error",
            message: "Erro de conexão ao verificar progresso do disparo.",
          });
          setIsSendingReminders(false);
        }
      }, 2000);
    } catch {
      // 8.6 — Erro de rede ou servidor
      setReminderToast({
        type: "error",
        message: "Falha de conexão. Verifique o servidor e tente novamente.",
      });
      setIsSendingReminders(false);
    }
  }, [isSendingReminders]);

  // Limpar polling ao desmontar o componente
  useEffect(() => {
    return () => {
      if (reminderPollRef.current) clearInterval(reminderPollRef.current);
    };
  }, []);

  // ─── ESTILOS VISUAIS PARA PILLS E BADGES ───────────────────
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── CABEÇALHO DO MÓDULO ─── */}
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
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* 8.1 — Botão Disparar Lembretes do Dia */}
          <button
            id="btn-disparar-lembretes"
            type="button"
            onClick={handleSendReminders}
            disabled={isSendingReminders}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          >
            {isSendingReminders ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            <span>{isSendingReminders ? "Disparando..." : "Disparar Lembretes"}</span>
          </button>

          <button
            onClick={() => handleDayClick(new Date(2026, 4, 20))}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* ─── BARRA DE BUSCA, FILTROS E CONTROLES ─── */}
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
            className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 transition-all cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Busca e Status Filtro */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          {/* Input de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Select de Status */}
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer font-semibold"
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

      {/* ─── VISÃO MENSAL EXPANDIDA DO CALENDÁRIO ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-300">
        {/* Dias da Semana (Headers) */}
        <div className="grid grid-cols-7 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 py-3 text-center">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
            <div key={label} className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {label}
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-150 dark:divide-slate-800 bg-slate-150/40 dark:bg-slate-800/20">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            
            // Recupera as sessões já indexadas para este dia em O(1)
            const daySessions = sessionsByDate[format(day, "yyyy-MM-dd")] || [];

            // Ordena sessões por hora de início
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
                {/* Cabeçalho do Dia (Número e Badge Hoje) */}
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
                      isDayToday
                        ? "text-sky-500"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Lista de Sessões (Pills) */}
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

                {/* Dica visual de hover para adicionar sessão */}
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

      {/* ─── LEGENDA DOS STATUS ─── */}
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

      {/* ─── SIDEBAR DESLIZANTE (DRAWER) ─── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Drawer */}
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

            {/* Conteúdo Central */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sidebarMode === "view" && selectedSession ? (
                // ─── VISUALIZAÇÃO DE DETALHES DA SESSÃO ───
                <div className="space-y-6">
                  {/* Status Badge */}
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
                        Lembrete WhatsApp Enviado
                      </span>
                    )}
                  </div>

                  {/* Informações Básicas do Paciente */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-base shrink-0">
                      {selectedSession.patient.nome.charAt(0)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate leading-snug">
                        {selectedSession.patient.nome}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">{selectedSession.patient.telefoneWhatsapp}</p>
                    </div>
                  </div>

                  {/* Detalhes do Horário */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Horário</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>
                          {format(parseISO(selectedSession.dataHoraInicio), "HH:mm")} - {format(parseISO(selectedSession.dataHoraFim), "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Combinado</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>R$ {selectedSession.patient.valorSessaoPadrao.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notas de Observação */}
                  {selectedSession.observacoes && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Observações Clínicas
                      </span>
                      <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 text-xs font-medium text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                        {selectedSession.observacoes}
                      </div>
                    </div>
                  )}

                  {/* Controle de Status Pickers (Segmented Control) */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Alterar Presença / Status:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { status: "agendada", label: "Agendada", color: "hover:border-sky-500 hover:text-sky-500 text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/5" },
                        { status: "realizada", label: "Realizada", color: "hover:border-emerald-500 hover:text-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
                        { status: "falta", label: "Falta", color: "hover:border-amber-500 hover:text-amber-500 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5" },
                        { status: "cancelada", label: "Cancelada", color: "hover:border-rose-500 hover:text-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5" },
                      ] as const).map((btn) => {
                        const isSel = selectedSession.status === btn.status;
                        return (
                          <button
                            key={btn.status}
                            onClick={() => handleUpdateStatus(btn.status)}
                            className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                              isSel ? btn.color + " ring-1 ring-inset" : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disparador do WhatsApp */}
                  <div className="pt-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${selectedSession.patient.telefoneWhatsapp}&text=Ol%C3%A1%20${encodeURIComponent(selectedSession.patient.nome)}!%20Passando%20para%20confirmar%20nossa%20sess%C3%A3o%20de%20psicologia%20agendada%20para%20o%20dia%20${format(parseISO(selectedSession.dataHoraInicio), "dd/MM")}%20%C3%A0s%20${format(parseISO(selectedSession.dataHoraInicio), "HH:mm")}.%20At%C3%A9%20l%C3%A1!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span>Confirmar por WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                // ─── FORMULÁRIO DE CRIAÇÃO DE AGENDAMENTO ───
                <form onSubmit={handleCreateAppointment} className="space-y-5">
                  {/* Seleção do Paciente */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Selecione o Paciente:
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-450" />
                      <select
                        value={formPatientId}
                        onChange={(e) => setFormPatientId(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none font-semibold cursor-pointer"
                      >
                        {MOCK_PATIENTS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (R$ {p.valorSessaoPadrao.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400 w-0 h-0" />
                    </div>
                  </div>

                  {/* Horários da Consulta */}
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
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold cursor-text"
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
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold cursor-text"
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

                  {/* Observações / Anotações */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Observações Clínicas (Opcional):
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={4}
                      placeholder="Ex: Queixa recorrente de ansiedade no trabalho, foco na discussão sobre limites..."
                      className="w-full p-4 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* Botões do Form */}
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
                      className="flex-1 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      Agendar Consulta
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer com Ações Destrutivas (se estiver visualizando) */}
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

      {/* ─── Toast de Progresso / Resultado do Disparo WhatsApp ─── */}
      {reminderToast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm max-w-sm transition-all duration-300 ${
            reminderToast.type === "progress"
              ? "bg-slate-900 dark:bg-slate-800 text-white border border-slate-700"
              : reminderToast.type === "success"
              ? "bg-emerald-500 text-white border border-emerald-400"
              : "bg-rose-500 text-white border border-rose-400"
          }`}
        >
          {reminderToast.type === "progress" && (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          )}
          <span className="flex-1">{reminderToast.message}</span>
          {reminderToast.type !== "progress" && (
            <button
              onClick={() => setReminderToast(null)}
              className="ml-1 opacity-80 hover:opacity-100 cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
