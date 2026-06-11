"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

type StockItem = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  custoUnitario: number | null;
  fornecedor: string | null;
};

type Movement = {
  id: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  motivo: string | null;
  createdAt: string;
};

const inputClass =
  "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400";

export default function EstoquePage() {
  const [userRole, setUserRole] = useState<string>("");
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [movements, setMovements] = useState<Record<string, Movement[]>>({});
  const [movLoading, setMovLoading] = useState<string | null>(null);

  // Form novo item
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    nome: "", categoria: "", unidade: "", quantidadeAtual: "0",
    quantidadeMinima: "0", custoUnitario: "", fornecedor: "",
  });

  // Form movimentação
  const [movForm, setMovForm] = useState<{ itemId: string; tipo: string; quantidade: string; motivo: string } | null>(null);
  const [movSaving, setMovSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/stock").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([stockData, meData]) => {
      if (stockData.success) setItems(stockData.data);
      if (meData.success) setUserRole(meData.data?.role ?? "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function loadMovements(itemId: string) {
    if (movements[itemId]) return;
    setMovLoading(itemId);
    const res = await fetch(`/api/stock/${itemId}/movements`);
    const data = await res.json();
    if (data.success) setMovements((prev) => ({ ...prev, [itemId]: data.data }));
    setMovLoading(null);
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadMovements(id);
    }
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          categoria: form.categoria || null,
          unidade: form.unidade,
          quantidadeAtual: parseFloat(form.quantidadeAtual) || 0,
          quantidadeMinima: parseFloat(form.quantidadeMinima) || 0,
          custoUnitario: form.custoUnitario ? parseFloat(form.custoUnitario) : null,
          fornecedor: form.fornecedor || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Erro ao criar item"); return; }
      setItems((prev) => [...prev, data.data]);
      setForm({ nome: "", categoria: "", unidade: "", quantidadeAtual: "0", quantidadeMinima: "0", custoUnitario: "", fornecedor: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleMovimento(e: React.FormEvent) {
    e.preventDefault();
    if (!movForm) return;
    setMovSaving(true);
    try {
      const res = await fetch(`/api/stock/${movForm.itemId}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: movForm.tipo,
          quantidade: parseFloat(movForm.quantidade),
          motivo: movForm.motivo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro"); return; }
      const qty = parseFloat(movForm.quantidade);
      setItems((prev) => prev.map((it) => {
        if (it.id !== movForm.itemId) return it;
        const curr = Number(it.quantidadeAtual);
        const nova = movForm.tipo === "entrada" ? curr + qty
          : movForm.tipo === "saida" ? curr - qty
          : qty;
        return { ...it, quantidadeAtual: nova };
      }));
      setMovements((prev) => ({
        ...prev,
        [movForm.itemId]: [data.data, ...(prev[movForm.itemId] ?? [])],
      }));
      setMovForm(null);
    } finally {
      setMovSaving(false);
    }
  }

  const alertCount = items.filter((i) => Number(i.quantidadeAtual) <= Number(i.quantidadeMinima)).length;
  const valorTotal = items.reduce((s, i) => s + (Number(i.quantidadeAtual) * (Number(i.custoUnitario) || 0)), 0);

  const TIPO_ICON = {
    entrada: <ArrowUp className="w-3 h-3 text-emerald-500" />,
    saida: <ArrowDown className="w-3 h-3 text-rose-500" />,
    ajuste: <RefreshCw className="w-3 h-3 text-amber-500" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Estoque
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                <AlertTriangle className="w-3 h-3" />
                {alertCount} alerta{alertCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Controle de insumos e materiais</p>
        </div>
        {userRole === "psicologo_admin" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Item
          </button>
        )}
      </div>

      {/* Card valor total */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4 w-fit">
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Valor Total em Estoque</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Modal novo item */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800 dark:text-slate-100">Novo Item de Estoque</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className={inputClass} placeholder="Luva descartável" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade *</label>
                  <input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} required className={inputClass} placeholder="caixa, unidade..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
                  <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClass} placeholder="consumível, material..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd. Atual</label>
                  <input type="number" step="0.001" min="0" value={form.quantidadeAtual} onChange={(e) => setForm({ ...form, quantidadeAtual: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd. Mínima</label>
                  <input type="number" step="0.001" min="0" value={form.quantidadeMinima} onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Custo Unitário (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.custoUnitario} onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })} className={inputClass} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fornecedor</label>
                  <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} className={inputClass} placeholder="Opcional" />
                </div>
              </div>
              {formError && <p className="text-xs text-rose-500">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "A guardar..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal movimentação */}
      {movForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800 dark:text-slate-100">Registrar Movimentação</h2>
              <button onClick={() => setMovForm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMovimento} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                <select value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })} className={inputClass}>
                  <option value="entrada">Entrada (compra/reposição)</option>
                  <option value="saida">Saída (uso/consumo)</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade *</label>
                <input type="number" step="0.001" min="0.001" required value={movForm.quantidade} onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Motivo</label>
                <input value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} className={inputClass} placeholder="Opcional" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setMovForm(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={movSaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
                  {movSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de itens */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum item no estoque</p>
          <p className="text-xs text-slate-400 mt-1">Clique em "Novo Item" para começar</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const isLow = Number(item.quantidadeAtual) <= Number(item.quantidadeMinima);
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl ${isLow ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.nome}</p>
                        {isLow && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            Baixo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.categoria && <span className="mr-2">{item.categoria}</span>}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{Number(item.quantidadeAtual)} {item.unidade}</span>
                        {item.quantidadeMinima > 0 && <span className="ml-1 text-slate-400">/ mín. {Number(item.quantidadeMinima)}</span>}
                        {item.custoUnitario && <span className="ml-2">· R$ {Number(item.custoUnitario).toFixed(2)}/un</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMovForm({ itemId: item.id, tipo: "entrada", quantidade: "1", motivo: "" })}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 rounded-lg transition-all"
                    >
                      Movimentar
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Histórico de movimentações */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-50 dark:border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 mt-4">Histórico</p>
                    {movLoading === item.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      </div>
                    ) : (movements[item.id] ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Nenhuma movimentação registrada.</p>
                    ) : (
                      <div className="space-y-2">
                        {(movements[item.id] ?? []).map((m) => (
                          <div key={m.id} className="flex items-center gap-3 text-xs">
                            <span>{TIPO_ICON[m.tipo]}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{m.tipo}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{Number(m.quantidade)} {item.unidade}</span>
                            {m.motivo && <span className="text-slate-400">· {m.motivo}</span>}
                            <span className="ml-auto text-slate-400">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
