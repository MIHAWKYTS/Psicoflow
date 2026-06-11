"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Search, CheckCircle2, Loader2 } from "lucide-react";
import FinanceiroForm from "./FinanceiroForm";

type MonthSummary = { mes: string; receita: number; despesa: number };
type Transaction = {
  id: string;
  patient: { nome: string } | null;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  statusPagamento: string;
  dataVencimento: string;
  formaPagamento: string | null;
  parcelas: number | null;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_COLORS: Record<string, string> = {
  pago: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
  pendente: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  cancelado: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
};
const STATUS_LABELS: Record<string, string> = { pago: "Pago", pendente: "Pendente", cancelado: "Cancelado" };
const TIPO_LABELS: Record<string, string> = { receita: "Receita", despesa: "Despesa" };
const FORMA_LABELS: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", cartao: "Cartão" };
const FORMA_COLORS: Record<string, string> = {
  pix: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
  dinheiro: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
  cartao: "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-900/30",
};

const PAGE_SIZE = 20;

export default function FinanceiroDashboard() {
  const [chartData, setChartData] = useState<MonthSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [search, setSearch] = useState("");
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  async function handleMarkPaid(id: string) {
    setMarkingPaid(id);
    try {
      const res = await fetch(`/api/financial/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPagamento: "pago" }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) => t.id === id ? { ...t, statusPagamento: "pago" } : t)
        );
      }
    } finally {
      setMarkingPaid(null);
    }
  }
  const [receitaMes, setReceitaMes] = useState(0);
  const [despesaMes, setDespesaMes] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterCategoria !== "todos") params.set("categoria", filterCategoria);
    fetch(`/api/financial/summary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setChartData(d.data);
          const last = d.data[d.data.length - 1];
          if (last) { setReceitaMes(last.receita); setDespesaMes(last.despesa); }
        }
      })
      .catch(() => {});
  }, [filterCategoria]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (filterTipo !== "todos") params.set("tipo", filterTipo);
    if (filterStatus !== "todos") params.set("status", filterStatus);
    if (filterCategoria !== "todos") params.set("categoria", filterCategoria);

    fetch(`/api/financial?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTransactions(d.data.items ?? []);
          setTotal(d.data.total ?? 0);
        }
      })
      .catch(() => {});
  }, [page, filterTipo, filterStatus, filterCategoria]);

  const filtered = search
    ? transactions.filter((t) =>
        (t.patient?.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
        t.descricao.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const saldo = receitaMes - despesaMes;

  const kpis = [
    {
      label: "Receita do Mês",
      value: formatBRL(receitaMes),
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Despesa do Mês",
      value: formatBRL(despesaMes),
      icon: TrendingDown,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Saldo do Mês",
      value: formatBRL(saldo),
      icon: saldo >= 0 ? Wallet : DollarSign,
      color: saldo >= 0
        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const CATEGORIA_OPTIONS = [
    { value: "todos", label: "Todos" },
    { value: "consultorio", label: "Clínica" },
    { value: "pessoal", label: "Pessoal" },
  ];

  return (
    <div className="space-y-6">
      {/* Toggle clínica / pessoal */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {CATEGORIA_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilterCategoria(opt.value); setPage(1); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterCategoria === opt.value
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${k.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {k.label}
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {k.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-4">
          Receita vs Despesa — Últimos 6 Meses
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(value) => formatBRL(Number(value))}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" name="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de transações */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
              Lançamentos
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {total} registros encontrados
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <select
              value={filterTipo}
              onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="todos">Todos Tipos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Paciente / Descrição</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {t.patient?.nome ?? "—"}
                      </p>
                      {t.descricao && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">
                          {t.descricao}
                        </p>
                      )}
                      {t.patient && t.formaPagamento && (
                        <span className={`inline-flex mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${FORMA_COLORS[t.formaPagamento] ?? ""}`}>
                          {FORMA_LABELS[t.formaPagamento] ?? t.formaPagamento}
                          {t.formaPagamento === "cartao" && t.parcelas && t.parcelas > 1
                            ? ` ${t.parcelas}x`
                            : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize text-xs font-medium">
                      {TIPO_LABELS[t.tipo] ?? t.tipo}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs capitalize">
                      {t.categoria}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {formatBRL(Number(t.valor))}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(t.dataVencimento).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${
                          STATUS_COLORS[t.statusPagamento] ?? STATUS_COLORS["cancelado"]
                        }`}
                      >
                        {STATUS_LABELS[t.statusPagamento] ?? t.statusPagamento}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.statusPagamento === "pendente" && (
                        <button
                          onClick={() => handleMarkPaid(t.id)}
                          disabled={markingPaid === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 rounded-lg transition-all disabled:opacity-50"
                        >
                          {markingPaid === t.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Formulário de lançamento */}
      <FinanceiroForm />
    </div>
  );
}
