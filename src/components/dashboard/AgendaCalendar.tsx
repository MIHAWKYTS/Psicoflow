"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import SessionDetailsSidebar from "./SessionDetailsSidebar";

// Dados de Mock para renderização rápida e de alta fidelidade visual
const MOCK_SESSIONS = [
  {
    id: "s1",
    dataHoraInicio: "2026-05-20T09:00:00Z",
    dataHoraFim: "2026-05-20T10:00:00Z",
    status: "realizada" as const,
    lembreteEnviado: true,
    patient: {
      id: "p1",
      nome: "Ana Beatriz Silva",
      telefoneWhatsapp: "(11) 98765-4321",
      valorSessaoPadrao: 150.00,
    },
  },
  {
    id: "s2",
    dataHoraInicio: "2026-05-20T11:30:00Z",
    dataHoraFim: "2026-05-20T12:30:00Z",
    status: "agendada" as const,
    lembreteEnviado: false,
    patient: {
      id: "p2",
      nome: "Carlos Eduardo Costa",
      telefoneWhatsapp: "(21) 99888-7766",
      valorSessaoPadrao: 180.00,
    },
  },
  {
    id: "s3",
    dataHoraInicio: "2026-05-20T14:00:00Z",
    dataHoraFim: "2026-05-20T15:00:00Z",
    status: "falta" as const,
    lembreteEnviado: true,
    patient: {
      id: "p3",
      nome: "Juliana Santos",
      telefoneWhatsapp: "(31) 97777-6655",
      valorSessaoPadrao: 160.00,
    },
  },
  {
    id: "s4",
    dataHoraInicio: "2026-05-21T10:00:00Z",
    dataHoraFim: "2026-05-21T11:00:00Z",
    status: "agendada" as const,
    lembreteEnviado: true,
    patient: {
      id: "p4",
      nome: "Mariana Souza",
      telefoneWhatsapp: "(11) 95555-4433",
      valorSessaoPadrao: 150.00,
    },
  },
  {
    id: "s5",
    dataHoraInicio: "2026-05-21T16:00:00Z",
    dataHoraFim: "2026-05-21T17:00:00Z",
    status: "cancelada" as const,
    lembreteEnviado: false,
    patient: {
      id: "p5",
      nome: "Rodrigo Almeida",
      telefoneWhatsapp: "(19) 96666-5544",
      valorSessaoPadrao: 200.00,
    },
  },
];

export default function AgendaCalendar() {
  const [view, setView] = useState<"semana" | "mes">("semana");
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<typeof MOCK_SESSIONS[0] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const statusThemes = {
    agendada: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-100/50 dark:hover:bg-sky-950/40",
    realizada: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40",
    cancelada: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-100/50 dark:hover:bg-rose-950/40",
    falta: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/40",
  };

  const dotColors = {
    agendada: "bg-sky-500",
    realizada: "bg-emerald-500",
    cancelada: "bg-rose-500",
    falta: "bg-amber-500",
  };

  const handleCardClick = (session: typeof MOCK_SESSIONS[0]) => {
    setSelectedSession(session);
    setIsSidebarOpen(true);
  };

  const handleStatusChangeInSidebar = (newStatus: "agendada" | "realizada" | "cancelada" | "falta") => {
    if (selectedSession) {
      const updatedSessions = sessions.map((s) =>
        s.id === selectedSession.id ? { ...s, status: newStatus } : s
      );
      setSessions(updatedSessions);
      setSelectedSession({ ...selectedSession, status: newStatus });
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.patient.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Controles de Filtro e Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Switcher de Visão Semanal/Mensal */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setView("semana")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              view === "semana"
                ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView("mes")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              view === "mes"
                ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            Mês
          </button>
        </div>

        {/* Busca e Status Filtro */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Input de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Select de Status */}
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
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

      {/* Grid de Horários da Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cabeçalho de Navegação da Agenda */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-sky-500" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">
              {view === "semana" ? "Semana Atual (20/05/2026 a 24/05/2026)" : "Maio, 2026"}
            </h2>
          </div>
          <div className="flex gap-1.5">
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-350 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-350 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layout Semanal */}
        {view === "semana" ? (
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
            {/* Dias da Semana */}
            {["Segunda (18/05)", "Terça (19/05)", "Quarta (20/05)", "Quinta (21/05)", "Sexta (22/05)"].map((dia, diaIdx) => {
              // Filtrar sessões específicas de cada dia do mock
              const diaNumero = diaIdx + 18;
              const sessoesDoDia = filteredSessions.filter((s) => {
                const data = new Date(s.dataHoraInicio);
                return data.getUTCDate() === diaNumero;
              });

              return (
                <div key={dia} className="p-4 min-h-[400px] flex flex-col space-y-3">
                  <div className="pb-2 border-b border-slate-200/65 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dia}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{sessoesDoDia.length} sessões</span>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {sessoesDoDia.length > 0 ? (
                      sessoesDoDia.map((session) => {
                        const hora = new Date(session.dataHoraInicio).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC"
                        });

                        return (
                          <div
                            key={session.id}
                            onClick={() => handleCardClick(session)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              statusThemes[session.status]
                            }`}
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
          /* Layout Mensal Simplificado */
          <div className="p-4 grid grid-cols-7 gap-2 text-center bg-slate-50/50 dark:bg-slate-950/20">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="text-xs font-bold text-slate-400 uppercase py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: 31 }).map((_, idx) => {
              const diaNum = idx + 1;
              const temSessoes = filteredSessions.some((s) => new Date(s.dataHoraInicio).getUTCDate() === diaNum);

              return (
                <div
                  key={idx}
                  className={`aspect-square p-2 border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 rounded-lg flex flex-col justify-between items-center transition-all ${
                    temSessoes ? "ring-2 ring-sky-500/10" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{diaNum}</span>
                  {temSessoes && (
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar para Detalhes de Sessão */}
      <SessionDetailsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        session={selectedSession}
        onStatusChange={handleStatusChangeInSidebar}
      />
    </div>
  );
}
