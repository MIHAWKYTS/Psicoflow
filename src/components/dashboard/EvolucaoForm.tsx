"use client";

import { useState } from "react";
import { PlusCircle, CheckCircle, AlertCircle } from "lucide-react";

type Evolution = {
  id: string;
  dataHora: string;
  temas: string;
  intervencoes: string;
  respostaPaciente?: string | null;
  encaminhamentos?: string | null;
  autor?: { nome: string } | null;
};

type Props = {
  recordId: string | null;
  patientId: string;
  onRecordCreated: (id: string) => void;
  onEvolutionAdded: (ev: Evolution) => void;
};

type FormState = {
  dataHora: string;
  temas: string;
  intervencoes: string;
  respostaPaciente: string;
  encaminhamentos: string;
};

const EMPTY: FormState = {
  dataHora: "",
  temas: "",
  intervencoes: "",
  respostaPaciente: "",
  encaminhamentos: "",
};

export default function EvolucaoForm({ recordId, patientId, onRecordCreated, onEvolutionAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.dataHora) errs.dataHora = "Data e hora são obrigatórias";
    if (form.temas.trim().length < 2) errs.temas = "Temas são obrigatórios";
    if (form.intervencoes.trim().length < 2) errs.intervencoes = "Intervenções são obrigatórias";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function ensureRecord(): Promise<string | null> {
    if (recordId) return recordId;
    const res = await fetch("/api/clinical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    const d = await res.json();
    if (!res.ok) return null;
    onRecordCreated(d.data.id);
    return d.data.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const rid = await ensureRecord();
      if (!rid) {
        setFeedback({ ok: false, msg: "Erro ao preparar prontuário." });
        return;
      }

      const body = {
        dataHora: new Date(form.dataHora).toISOString(),
        temas: form.temas,
        intervencoes: form.intervencoes,
        respostaPaciente: form.respostaPaciente || undefined,
        encaminhamentos: form.encaminhamentos || undefined,
      };

      const res = await fetch(`/api/clinical-records/${rid}/evolutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();

      if (res.ok) {
        onEvolutionAdded(d.data);
        setForm(EMPTY);
        setOpen(false);
        setFeedback({ ok: true, msg: "Evolução registrada." });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ ok: false, msg: d.error ?? "Erro ao registrar evolução." });
      }
    } catch {
      setFeedback({ ok: false, msg: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  }

  const textareaClass =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1";
  const errorClass = "text-xs text-rose-500 mt-1";

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        Registrar Nova Evolução
      </button>

      {feedback && (
        <div
          className={`mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            feedback.ok
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400"
          }`}
        >
          {feedback.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {feedback.msg}
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Data e hora */}
          <div>
            <label className={labelClass}>Data e Hora da Sessão</label>
            <input
              type="datetime-local"
              value={form.dataHora}
              onChange={(e) => set("dataHora", e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {errors.dataHora && <p className={errorClass}>{errors.dataHora}</p>}
          </div>

          {/* Temas */}
          <div>
            <label className={labelClass}>Temas Abordados *</label>
            <textarea
              rows={3}
              value={form.temas}
              onChange={(e) => set("temas", e.target.value)}
              placeholder="Principais assuntos discutidos na sessão..."
              className={textareaClass}
            />
            {errors.temas && <p className={errorClass}>{errors.temas}</p>}
          </div>

          {/* Intervenções */}
          <div>
            <label className={labelClass}>Intervenções Realizadas *</label>
            <textarea
              rows={3}
              value={form.intervencoes}
              onChange={(e) => set("intervencoes", e.target.value)}
              placeholder="Técnicas utilizadas, exercícios propostos..."
              className={textareaClass}
            />
            {errors.intervencoes && <p className={errorClass}>{errors.intervencoes}</p>}
          </div>

          {/* Resposta do Paciente */}
          <div>
            <label className={labelClass}>Resposta do Paciente</label>
            <textarea
              rows={2}
              value={form.respostaPaciente}
              onChange={(e) => set("respostaPaciente", e.target.value)}
              placeholder="Como o paciente reagiu às intervenções..."
              className={textareaClass}
            />
          </div>

          {/* Encaminhamentos */}
          <div>
            <label className={labelClass}>Encaminhamentos</label>
            <textarea
              rows={2}
              value={form.encaminhamentos}
              onChange={(e) => set("encaminhamentos", e.target.value)}
              placeholder="Tarefas para casa, encaminhamentos para outros profissionais..."
              className={textareaClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setForm(EMPTY); setErrors({}); }}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold transition-all"
            >
              {loading ? "Salvando..." : "Salvar Evolução"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
