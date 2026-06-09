"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Search, Loader2 } from "lucide-react";

type Summary = {
  sessoesHoje: { total: number; realizadas: number; pendentes: number };
  faturamentoMes: number;
  despesasMes: number;
  pacientesAtivos: number;
  previsaoReceita: number;
};

type Receivable = {
  id: string;
  patient: { nome: string } | null;
  valor: number;
  dataVencimento: string;
  statusPagamento: string;
  categoria: string;
  tipo: string;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pago: {
    label: "Pago",
    className: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
  },
};

export default function DashboardOverview({ role }: { role: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSummary(d.data); })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/dashboard/receivables");
        const d = await r.json();
        if (!cancelled && d.success) setReceivables(d.data.transactions ?? []);
      } catch {}
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const kpis = [
    {
      title: "Sessões Hoje",
      value: summary ? String(summary.sessoesHoje.total) : "—",
      unit: "sessões",
      desc: summary
        ? `${summary.sessoesHoje.pendentes} pendentes · ${summary.sessoesHoje.realizadas} realizadas`
        : "Carregando...",
      icon: Calendar,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      accent: "border-l-indigo-500",
    },
    {
      title: "Faturamento do Mês",
      value: summary ? formatBRL(summary.faturamentoMes) : "—",
      unit: "",
      desc: "Receitas pagas no mês",
      icon: TrendingUp,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accent: "border-l-emerald-500",
      trend: "up" as const,
    },
    {
      title: "Despesas do Mês",
      value: summary ? formatBRL(summary.despesasMes) : "—",
      unit: "",
      desc: "Total de despesas",
      icon: ArrowDownRight,
      iconBg: "bg-rose-50 dark:bg-rose-950/30",
      iconColor: "text-rose-600 dark:text-rose-400",
      accent: "border-l-rose-500",
      trend: "down" as const,
    },
    {
      title: "Pacientes Ativos",
      value: summary ? String(summary.pacientesAtivos) : "—",
      unit: "pacientes",
      desc: "Com status ativo",
      icon: Users,
      iconBg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      accent: "border-l-violet-500",
    },
    {
      title: "Previsão de Receita",
      value: summary ? formatBRL(summary.previsaoReceita) : "—",
      unit: "",
      desc: "Sessões agendadas",
      icon: DollarSign,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      accent: "border-l-amber-500",
    },
  ];

  const filteredReceivables = receivables.filter((r) => {
    const nome = r.patient?.nome ?? "";
    const matchesSearch = nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "todos" || r.statusPagamento === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 border-l-4 ${kpi.accent} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-3`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl ${kpi.iconBg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>

              <div>
                {loadingSummary ? (
                  <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {kpi.value}
                    {kpi.unit && (
                      <span className="text-sm font-semibold text-slate-400 ml-1.5">{kpi.unit}</span>
                    )}
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                  {kpi.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {kpi.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                  {kpi.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Recebíveis — apenas psicologo_admin */}
      {role === "psicologo_admin" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Recebíveis
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Fluxo de lançamentos e controle de consultas
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-52 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="todos">Todos Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
                  {["Paciente", "Tipo", "Categoria", "Valor", "Vencimento", "Status"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${i >= 1 && i <= 2 ? "hidden sm:table-cell" : ""} ${i === 4 ? "hidden sm:table-cell" : ""} ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredReceivables.length > 0 ? (
                  filteredReceivables.map((r) => {
                    const status = STATUS_CONFIG[r.statusPagamento] ?? STATUS_CONFIG["cancelado"];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-100 text-sm">
                          {r.patient?.nome ?? "—"}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4">
                          <span className={`text-xs font-semibold ${r.tipo === "receita" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {r.tipo === "receita" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4 text-xs text-slate-500 dark:text-slate-400 capitalize font-medium">
                          {r.categoria}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatBRL(Number(r.valor))}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {new Date(r.dataVencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full border ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {receivables.length === 0 ? (
                          <>
                            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                            <span className="text-sm text-slate-400">Carregando recebíveis...</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">Nenhum resultado para o filtro aplicado.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
