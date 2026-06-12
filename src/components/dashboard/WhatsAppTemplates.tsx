"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Star, X, Loader2, MessageSquare } from "lucide-react";

type Template = {
  id: string;
  nome: string;
  mensagem: string;
  isDefault: boolean;
};

const EMPTY_FORM = { nome: "", mensagem: "" };

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchTemplates() {
    setLoading(true);
    try {
      const r = await fetch("/api/whatsapp/templates");
      const d = await r.json();
      setTemplates(d.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTemplates(); }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setEditingId("new");
  }

  function openEdit(t: Template) {
    setForm({ nome: t.nome, mensagem: t.mensagem });
    setError("");
    setEditingId(t.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.mensagem.trim()) {
      setError("Nome e mensagem são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/whatsapp/templates" : `/api/whatsapp/templates/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: form.nome.trim(), mensagem: form.mensagem.trim() }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao salvar.");
        return;
      }
      await fetchTemplates();
      setEditingId(null);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este template?")) return;
    await fetch(`/api/whatsapp/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/whatsapp/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Templates WhatsApp</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Mensagens reutilizáveis para lembretes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo template
        </button>
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            {templates.map((t) => (
              <div key={t.id}>
                {editingId === t.id ? (
                  <TemplateForm
                    form={form}
                    setForm={setForm}
                    error={error}
                    saving={saving}
                    onSave={handleSave}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {t.nome}
                        </span>
                        {t.isDefault && (
                          <span className="text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">
                        {t.mensagem}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!t.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(t.id)}
                          title="Definir como padrão"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {editingId === "new" && (
              <TemplateForm
                form={form}
                setForm={setForm}
                error={error}
                saving={saving}
                onSave={handleSave}
                onCancel={cancelEdit}
              />
            )}

            {templates.length === 0 && editingId !== "new" && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                Nenhum template criado ainda.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  form,
  setForm,
  error,
  saving,
  onSave,
  onCancel,
}: {
  form: { nome: string; mensagem: string };
  setForm: (v: { nome: string; mensagem: string }) => void;
  error: string;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputClass =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400";

  return (
    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10 space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Nome do template
        </label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Confirmação de sessão"
          className={inputClass}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Mensagem
        </label>
        <textarea
          value={form.mensagem}
          onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          placeholder="Ex: Olá {{nome}}! Confirmando sua sessão às {{horario}}. Pode confirmar?"
          rows={4}
          className={`${inputClass} resize-none`}
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Variáveis disponíveis: <code className="font-mono">{"{{nome}}"}</code> e{" "}
          <code className="font-mono">{"{{horario}}"}</code>
        </p>
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
