"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Paperclip,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  Briefcase,
  FolderOpen,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

type UploadStatus = { type: "success" | "error"; msg: string } | null;

type ClinicalCase = {
  id: string;
  titulo: string;
  descricao?: string;
  hipoteses?: string;
  documentosUrls: string[];
};

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

export default function CasosPage() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [role, setRole] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [hipoteses, setHipoteses] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ titulo: "", descricao: "", hipoteses: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const { startUpload } = useUploadThing("documentUploader", {
    onUploadBegin: () => setUploading(true),
    onClientUploadComplete: async (res: any[]) => {
      setUploading(false);
      const url = (res?.[0] as any)?.ufsUrl ?? res?.[0]?.url;
      if (!url) { showStatus({ type: "error", msg: "Não foi possível obter a URL do arquivo." }); return; }
      const entry = JSON.stringify({ name: res[0].name, url });
      const r = await fetch(`/api/clinical-cases/${selectedCaseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl: entry }),
      });
      if (r.ok) { showStatus({ type: "success", msg: `"${res[0].name}" anexado com sucesso.` }); fetchCases(); }
      else showStatus({ type: "error", msg: "Arquivo enviado, mas falhou ao salvar no caso." });
    },
    onUploadError: (err: Error) => { setUploading(false); showStatus({ type: "error", msg: err.message }); },
  });

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clinical-cases");
      const data = await res.json();
      setCases(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.data?.role) setRole(d.data.role); });
  }, [fetchCases]);

  function showStatus(status: UploadStatus) {
    setUploadStatus(status);
    setTimeout(() => setUploadStatus(null), 4000);
  }

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/clinical-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, hipoteses, documentosUrls: [] }),
    });
    setCreating(false);
    if (res.ok) {
      setTitulo("");
      setDescricao("");
      setHipoteses("");
      fetchCases();
    }
  }

  function startEdit(c: ClinicalCase) {
    setEditingId(c.id);
    setEditFields({ titulo: c.titulo, descricao: c.descricao ?? "", hipoteses: c.hipoteses ?? "" });
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    const res = await fetch(`/api/clinical-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFields),
    });
    setSavingId(null);
    if (res.ok) { setEditingId(null); fetchCases(); }
  }

  async function handleDelete(id: string, titulo: string) {
    if (!window.confirm(`Remover o caso "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    await fetch(`/api/clinical-cases/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setCases((prev) => prev.filter((c) => c.id !== id));
  }

  const isAdmin = role === "psicologo_admin";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
            Casos Clínicos
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Organize supervisões com hipóteses e anexos por caso
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — formulários */}
        <div className="space-y-4">
          {/* Criar caso */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Novo Caso
            </h2>
            <form onSubmit={handleCreateCase} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título *</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Caso João — ansiedade"
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Resumo clínico..."
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hipóteses Diagnósticas</label>
                <input
                  value={hipoteses}
                  onChange={(e) => setHipoteses(e.target.value)}
                  placeholder="F41.1, TAG, etc."
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !titulo.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {creating ? "Criando..." : "Criar Caso"}
              </button>
            </form>
          </div>

          {/* Anexar documento */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" />
              Anexar Documento
            </h2>

            <div className="space-y-3">
              <select
                value={selectedCaseId}
                onChange={(e) => { setSelectedCaseId(e.target.value); setUploadStatus(null); }}
                className={inputClass}
              >
                <option value="">Selecione um caso</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>

              {selectedCaseId ? (
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  uploading
                    ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10"
                }`}>
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /><span className="text-xs font-semibold text-indigo-500">Enviando...</span></>
                  ) : (
                    <><Paperclip className="w-4 h-4 text-slate-400" /><span className="text-xs font-semibold text-slate-500">Escolher arquivo</span></>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files; if (f?.length) startUpload(Array.from(f)); e.target.value = ""; }}
                  />
                </label>
              ) : (
                <p className="text-xs text-slate-400 py-1 text-center">
                  Selecione um caso para habilitar o upload
                </p>
              )}

              {uploadStatus && (
                <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                  uploadStatus.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
                }`}>
                  {uploadStatus.type === "success"
                    ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>{uploadStatus.msg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita — lista de casos */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FolderOpen className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Nenhum caso clínico criado</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Crie seu primeiro caso usando o formulário ao lado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((clinicalCase) => {
                const isEditing = editingId === clinicalCase.id;
                const isSaving = savingId === clinicalCase.id;
                const isDeleting = deletingId === clinicalCase.id;

                return (
                  <div
                    key={clinicalCase.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 transition-all hover:shadow-md"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input value={editFields.titulo} onChange={(e) => setEditFields((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título" className={inputClass} />
                        <input value={editFields.descricao} onChange={(e) => setEditFields((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descrição" className={inputClass} />
                        <input value={editFields.hipoteses} onChange={(e) => setEditFields((f) => ({ ...f, hipoteses: e.target.value }))} placeholder="Hipóteses" className={inputClass} />
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => saveEdit(clinicalCase.id)} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold">
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Salvar
                          </button>
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-violet-500" />
                            </div>
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                              {clinicalCase.titulo}
                            </h2>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(clinicalCase)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(clinicalCase.id, clinicalCase.titulo)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50 transition-colors"
                              >
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {clinicalCase.descricao && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {clinicalCase.descricao}
                          </p>
                        )}

                        {clinicalCase.hipoteses && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                            {clinicalCase.hipoteses}
                          </span>
                        )}

                        {clinicalCase.documentosUrls.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Documentos anexados
                            </p>
                            <ul className="space-y-1">
                              {clinicalCase.documentosUrls.map((doc) => {
                                let name = doc;
                                let href = doc;
                                try { const p = JSON.parse(doc); name = p.name ?? doc; href = p.url ?? doc; } catch {}
                                return (
                                  <li key={doc} className="flex items-center gap-2">
                                    <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                                      {name}
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
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
      </div>
    </div>
  );
}
