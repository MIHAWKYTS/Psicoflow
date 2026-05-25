"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, User, Phone, Calendar, Shield, CreditCard, ChevronRight } from "lucide-react";

// Mock de pacientes para renderização visual premium imediata
const MOCK_PATIENTS = [
  {
    id: "p1",
    nome: "Ana Beatriz Silva",
    telefoneWhatsapp: "(11) 98765-4321",
    status: "ativo",
    frequenciaSessoes: "semanal",
    valorSessaoPadrao: 150.00,
    ultimaSessao: "2026-05-20",
  },
  {
    id: "p2",
    nome: "Carlos Eduardo Costa",
    telefoneWhatsapp: "(21) 99888-7766",
    status: "ativo",
    frequenciaSessoes: "quinzenal",
    valorSessaoPadrao: 180.00,
    ultimaSessao: "2026-05-20",
  },
  {
    id: "p3",
    nome: "Juliana Santos",
    telefoneWhatsapp: "(31) 97777-6655",
    status: "ativo",
    frequenciaSessoes: "semanal",
    valorSessaoPadrao: 160.00,
    ultimaSessao: "2026-05-20",
  },
  {
    id: "p4",
    nome: "Mariana Souza",
    telefoneWhatsapp: "(11) 95555-4433",
    status: "ativo",
    frequenciaSessoes: "mensal",
    valorSessaoPadrao: 150.00,
    ultimaSessao: "2026-05-21",
  },
  {
    id: "p5",
    nome: "Rodrigo Almeida",
    telefoneWhatsapp: "(19) 96666-5544",
    status: "inativo",
    frequenciaSessoes: "semanal",
    valorSessaoPadrao: 200.00,
    ultimaSessao: "2026-05-21",
  },
];

export default function PacientesPage() {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            Pacientes Cadastrados
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            Gerenciamento de fichas, históricos clínicos e dados de contato
          </p>
        </div>

        {/* Botão cadastrar */}
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow active:scale-98 transition-all w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Controles de filtro */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Campo de Busca */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filtro de Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="todos">Todos Status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Grid de Cards de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/pacientes/${patient.id}`}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Header do card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-base shrink-0">
                    {patient.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-500 transition-colors truncate">
                      {patient.nome}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border mt-1 ${
                        patient.status === "ativo"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      {patient.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Informações de contato */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{patient.telefoneWhatsapp || "Sem telefone"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Frequência: <strong className="capitalize">{patient.frequenciaSessoes}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Sessão: <strong>R$ {patient.valorSessaoPadrao.toFixed(2)}</strong></span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
