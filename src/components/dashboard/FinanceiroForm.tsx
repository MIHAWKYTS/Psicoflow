"use client";

import { useState, useEffect } from "react";
import { PlusCircle, CheckCircle, AlertCircle } from "lucide-react";

type Patient = { id: string; nome: string };

type FormState = {
  tipo: "receita" | "despesa";
  categoria: "consultorio" | "pessoal";
  descricao: string;
  valor: string;
  dataVencimento: string;
  statusPagamento: "pendente" | "pago" | "cancelado";
  patientId: string;
};

const EMPTY: FormState = {
  tipo: "receita",
  categoria: "consultorio",
  descricao: "",
  valor: "",
  dataVencimento: "",
  statusPagamento: "pendente",
  patientId: "",
};

export default function FinanceiroForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    fetch("/api/patients?status=ativo&limit=200")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPatients(d.data?.items ?? []); })
      .catch(() => {});
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.valor || isNaN(Number(form.valor)) || Number(form.valor) <= 0)
      errs.valor = "Valor deve ser positivo";
    if (form.tipo === "despesa" && !form.dataVencimento)
      errs.dataVencimento = "Data de vencimento é obrigatória";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const body: Record<string, unknown> = {
        tipo: form.tipo,
        categoria: form.categoria,
        valor: Number(form.valor),
        statusPagamento: form.statusPagamento,
      };
      if (form.descricao) body.descricao = form.descricao;
      if (form.dataVencimento) body.dataVencimento = new Date(form.dataVencimento).toISOString();
      if (form.patientId) body.patientId = form.patientId;

      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({ ok: true, msg: "Lançamento registrado com sucesso!" });
        setForm(EMPTY);
      } else {
        setFeedback({ ok: false, msg: data.error ?? "Erro ao registrar lançamento." });
      }
    } catch {
      setFeedback({ ok: false, msg: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all";
  const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1";
  const errorClass = "text-xs text-rose-500 mt-1";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-sky-500" />
          Novo Lançamento
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Registre receitas e despesas do consultório
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-5 ${
            feedback.ok
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
          }`}
        >
          {feedback.ok ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => {
              const v = e.target.value as FormState["tipo"];
              set("tipo", v);
              if (v === "receita") set("dataVencimento", "");
            }}
            className={inputClass}
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className={labelClass}>Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value as FormState["categoria"])}
            className={inputClass}
          >
            <option value="consultorio">Consultório</option>
            <option value="pessoal">Pessoal</option>
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className={labelClass}>Valor (R$)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            value={form.valor}
            onChange={(e) => set("valor", e.target.value)}
            className={inputClass}
          />
          {errors.valor && <p className={errorClass}>{errors.valor}</p>}
        </div>

        {/* Data de Vencimento — só para despesa */}
        {form.tipo === "despesa" && (
          <div>
            <label className={labelClass}>Data de Vencimento</label>
            <input
              type="date"
              value={form.dataVencimento}
              onChange={(e) => set("dataVencimento", e.target.value)}
              className={inputClass}
            />
            {errors.dataVencimento && <p className={errorClass}>{errors.dataVencimento}</p>}
          </div>
        )}

        {/* Status de Pagamento */}
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.statusPagamento}
            onChange={(e) => set("statusPagamento", e.target.value as FormState["statusPagamento"])}
            className={inputClass}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Paciente (opcional) */}
        <div>
          <label className={labelClass}>Paciente (opcional)</label>
          <select
            value={form.patientId}
            onChange={(e) => set("patientId", e.target.value)}
            className={inputClass}
          >
            <option value="">— Sem paciente —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Descrição (span 2) */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição (opcional)</label>
          <input
            type="text"
            placeholder="Ex: Aluguel de sala, consulta João..."
            value={form.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Submit */}
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {loading ? "Registrando..." : "Registrar Lançamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
