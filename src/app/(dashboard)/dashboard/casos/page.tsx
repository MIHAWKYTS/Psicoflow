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
  "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

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
      if (r.ok) { showStatus({ type: "success", msg: `Documento "${res[0].name}" anexado com sucesso.` }); fetchCases(); }
      else showStatus({ type: "error", msg: "Arquivo enviado, mas falhou ao salvar no caso." });
    },
    onUploadError: (err: Error) => { setUploading(false); showStatus({ type: "error", msg: err.message }); },
  });

  const fetchCases = useCallback(async () => {
    const res = await fetch("/api/clinical-cases");
    const data = await res.json();
    setCases(data.data || []);
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
    const res = await fetch("/api/clinical-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, hipoteses, documentosUrls: [] }),
    });
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

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    const res = await fetch(`/api/clinical-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFields),
    });
    setSavingId(null);
    if (res.ok) {
      setEditingId(null);
      fetchCases();
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Casos Clínicos
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Organize supervisões com hipóteses e anexos por caso.
        </p>
      </div>

      {/* Criar caso */}
      <form
        onSubmit={handleCreateCase}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do caso"
          className={inputClass}
          required
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição resumida"
          className={inputClass}
        />
        <input
          value={hipoteses}
          onChange={(e) => setHipoteses(e.target.value)}
          placeholder="Hipóteses diagnósticas"
          className={inputClass}
        />
        <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold md:col-span-3">
          Criar caso
        </button>
      </form>

      {/* Anexar documento via upload */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Anexar documento</p>
        </div>

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
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all">
                {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Enviando...</> : "Escolha o arquivo"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files; if (f?.length) startUpload(Array.from(f)); e.target.value = ""; }}
                />
              </label>
            </div>

            {uploadStatus && (
              <div
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  uploadStatus.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
                }`}
              >
                {uploadStatus.type === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span>{uploadStatus.msg}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-1">
            Selecione um caso para habilitar o upload.
          </p>
        )}
      </div>

      {/* Lista de casos */}
      <div className="space-y-3">
        {cases.map((clinicalCase) => {
          const isEditing = editingId === clinicalCase.id;
          const isSaving = savingId === clinicalCase.id;
          const isDeleting = deletingId === clinicalCase.id;

          return (
            <div
              key={clinicalCase.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              {isEditing ? (
                /* Edit mode */
                <div className="space-y-3">
                  <input
                    value={editFields.titulo}
                    onChange={(e) => setEditFields((f) => ({ ...f, titulo: e.target.value }))}
                    placeholder="Título"
                    className={inputClass}
                  />
                  <input
                    value={editFields.descricao}
                    onChange={(e) => setEditFields((f) => ({ ...f, descricao: e.target.value }))}
                    placeholder="Descrição"
                    className={inputClass}
                  />
                  <input
                    value={editFields.hipoteses}
                    onChange={(e) => setEditFields((f) => ({ ...f, hipoteses: e.target.value }))}
                    placeholder="Hipóteses diagnósticas"
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(clinicalCase.id)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Salvar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-slate-700 dark:text-slate-200">{clinicalCase.titulo}</h2>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(clinicalCase)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                          title="Editar caso"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(clinicalCase.id, clinicalCase.titulo)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50 transition-colors"
                          title="Remover caso"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {clinicalCase.descricao && (
                    <p className="text-sm text-slate-500 mt-1">{clinicalCase.descricao}</p>
                  )}
                  {clinicalCase.hipoteses && (
                    <p className="text-xs text-slate-500 mt-2">
                      <strong>Hipóteses:</strong> {clinicalCase.hipoteses}
                    </p>
                  )}
                  {clinicalCase.documentosUrls.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {clinicalCase.documentosUrls.map((doc: string) => {
                        let name = doc;
                        let href = doc;
                        try {
                          const parsed = JSON.parse(doc);
                          name = parsed.name ?? doc;
                          href = parsed.url ?? doc;
                        } catch {}
                        return (
                          <li key={doc} className="flex items-center gap-1.5">
                            <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline truncate max-w-sm"
                            >
                              {name}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
