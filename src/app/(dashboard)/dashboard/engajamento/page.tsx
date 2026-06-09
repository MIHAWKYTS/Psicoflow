"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, CheckCircle, XCircle, Loader2, Paperclip } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";

type Patient = { id: string; nome: string };
type StatusBanner = { type: "success" | "error"; msg: string } | null;

export default function EngajamentoPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fileUrls, setFileUrls] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadBanner, setUploadBanner] = useState<StatusBanner>(null);
  const [sendBanner, setSendBanner] = useState<StatusBanner>(null);

  useEffect(() => {
    async function loadPatients() {
      const res = await fetch("/api/patients");
      const data = await res.json();
      const rows: Patient[] = data.data?.items || data.data || [];
      setPatients(rows);
      if (rows[0]?.id) setPatientId(rows[0].id);
    }
    loadPatients();
  }, []);

  function showUploadBanner(status: StatusBanner) {
    setUploadBanner(status);
    setTimeout(() => setUploadBanner(null), 4000);
  }

  function showSendBanner(status: StatusBanner) {
    setSendBanner(status);
    if (status?.type === "success") setTimeout(() => setSendBanner(null), 5000);
  }

  function removeFile(url: string) {
    setFileUrls((prev) => prev.filter((f) => f.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fileUrls.length === 0) {
      showSendBanner({ type: "error", msg: "Adicione ao menos um arquivo para enviar." });
      return;
    }
    setSending(true);
    setSendBanner(null);

    const res = await fetch("/api/engagement/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, mensagem, fileUrls: fileUrls.map((f) => f.url) }),
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      showSendBanner({ type: "success", msg: data.message ?? "Material enviado com sucesso via WhatsApp." });
      setMensagem("");
      setFileUrls([]);
    } else {
      showSendBanner({ type: "error", msg: data.error ?? "Falha ao enviar material." });
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Engajamento pós-sessão
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Envie materiais terapêuticos diretamente pelo WhatsApp.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        {/* Paciente */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Paciente
          </label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputClass} required>
            <option value="">Selecione um paciente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Mensagem
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Ex: Olá! Segue o material que conversamos na sessão de hoje."
            rows={3}
            className={inputClass}
            required
          />
        </div>

        {/* Upload de arquivos */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Arquivos (PDF ou imagem)
          </label>

          <div className="flex items-center gap-3">
            <UploadButton
              endpoint="materialUploader"
              content={{ button: uploading ? "Enviando..." : "Escolha o arquivo" }}
              appearance={{
                button:
                  "bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all after:bg-sky-600",
                allowedContent: "text-slate-400 text-[11px]",
              }}
              onUploadBegin={() => { setUploading(true); setUploadBanner(null); }}
              onClientUploadComplete={(res) => {
                setUploading(false);
                const novos = res.map((f) => ({
                  url: (f as any).ufsUrl ?? f.url,
                  name: f.name,
                }));
                setFileUrls((prev) => [...prev, ...novos]);
                showUploadBanner({
                  type: "success",
                  msg: `${res.length} arquivo${res.length > 1 ? "s adicionados" : " adicionado"} com sucesso.`,
                });
              }}
              onUploadError={(err) => {
                setUploading(false);
                showUploadBanner({ type: "error", msg: err.message });
              }}
            />
            {uploading && <Loader2 className="w-4 h-4 animate-spin text-sky-500 shrink-0" />}
          </div>

          {/* Banner upload */}
          {uploadBanner && (
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                uploadBanner.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
              }`}
            >
              {uploadBanner.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span>{uploadBanner.msg}</span>
            </div>
          )}

          {/* Lista de arquivos adicionados */}
          {fileUrls.length > 0 && (
            <ul className="space-y-1">
              {fileUrls.map((f) => (
                <li
                  key={f.url}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.url)}
                    className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Banner envio WhatsApp */}
        {sendBanner && (
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              sendBanner.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
            }`}
          >
            {sendBanner.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span>{sendBanner.msg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || fileUrls.length === 0 || uploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold transition-all"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Enviar via WhatsApp
            </>
          )}
        </button>
      </form>
    </div>
  );
}
