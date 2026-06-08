"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Search } from "lucide-react";

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
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_COLORS: Record<string, string> = {
  pago: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
  pendente: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  cancelado: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
};

const STATUS_LABELS: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

export default function DashboardOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Carrega KPIs reais
  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSummary(d.data); })
      .catch(() => {});
  }, []);

  // SSE para recebíveis
  useEffect(() => {
    const es = new EventSource("/api/dashboard/receivables/stream");
    es.onmessage = (e) => {
      try {
        const { transactions } = JSON.parse(e.data);
        setReceivables(transactions);
      } catch {}
    };
    return () => es.close();
  }, []);

  const kpis = [
    {
      title: "Sessões Hoje",
      value: summary ? `${summary.sessoesHoje.total} sessões` : "—",
      desc: summary
        ? `${summary.sessoesHoje.pendentes} pendentes, ${summary.sessoesHoje.realizadas} realizadas`
        : "Carregando...",
      icon: Calendar,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      title: "Faturamento",
      value: summary ? formatBRL(summary.faturamentoMes) : "—",
      desc: "Receitas pagas no mês",
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      trend: "up" as const,
    },
    {
      title: "Despesas",
      value: summary ? formatBRL(summary.despesasMes) : "—",
      desc: "Despesas do mês",
      icon: ArrowDownRight,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      trend: "down" as const,
    },
    {
      title: "Pacientes Ativos",
      value: summary ? `${summary.pacientesAtivos} ativos` : "—",
      desc: "Com status ativo",
      icon: Users,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Previsão de Receita",
      value: summary ? formatBRL(summary.previsaoReceita) : "—",
      desc: "Com base nas sessões agendadas",
      icon: TrendingUp,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const filteredReceivables = receivables.filter((r) => {
    const nome = r.patient?.nome ?? "";
    const matchesSearch = nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "todos" || r.statusPagamento === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Grade de 5 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-350 hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl ${kpi.color} transition-colors`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {kpi.value}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  {kpi.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                  {kpi.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                  {kpi.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Recebíveis */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 self-start">
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
              Tabela de Recebíveis
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Fluxo de lançamentos e controle financeiro de consultas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-36 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="todos">Todos Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-4">Paciente</th>
                <th className="hidden sm:table-cell px-6 py-4">Categoria</th>
                <th className="px-4 sm:px-6 py-4">Valor</th>
                <th className="hidden sm:table-cell px-6 py-4">Data Vencimento</th>
                <th className="px-4 sm:px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {filteredReceivables.length > 0 ? (
                filteredReceivables.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {r.patient?.nome ?? "—"}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-500 text-xs font-medium dark:text-slate-400 capitalize">
                      {r.categoria}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {formatBRL(Number(r.valor))}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(r.dataVencimento).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${
                          STATUS_COLORS[r.statusPagamento] ?? STATUS_COLORS["cancelado"]
                        }`}
                      >
                        {STATUS_LABELS[r.statusPagamento] ?? r.statusPagamento}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    {receivables.length === 0
                      ? "Conectando..."
                      : "Nenhum recebível correspondente ao filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
