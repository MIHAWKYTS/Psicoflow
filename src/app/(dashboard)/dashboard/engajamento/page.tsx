"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, CheckCircle, XCircle, Loader2, Paperclip, Send } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

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

  const { startUpload } = useUploadThing("materialUploader", {
    onUploadBegin: () => { setUploading(true); setUploadBanner(null); },
    onClientUploadComplete: (res: any[]) => {
      setUploading(false);
      const novos = res.map((f: any) => ({ url: f.ufsUrl ?? f.url, name: f.name }));
      setFileUrls((prev) => [...prev, ...novos]);
      showUploadBanner({ type: "success", msg: `${res.length} arquivo${res.length > 1 ? "s adicionados" : " adicionado"}.` });
    },
    onUploadError: (err: Error) => { setUploading(false); showUploadBanner({ type: "error", msg: err.message }); },
  });

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
      body: JSON.stringify({ patientId, mensagem, files: fileUrls.map((f) => ({ url: f.url, name: f.name })) }),
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
            Engajamento Pós-Sessão
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Envie materiais terapêuticos diretamente pelo WhatsApp
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Paciente */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">Selecione um paciente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* Mensagem */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mensagem *</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Ex: Olá! Segue o material que conversamos na sessão de hoje."
            rows={4}
            required
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400"
          />
        </div>

        {/* Arquivos */}
        <div className="p-5 space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Arquivos (PDF ou imagem)
          </label>

          <label className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            uploading
              ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/10"
              : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10"
          }`}>
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-indigo-500">Enviando arquivo...</span>
              </>
            ) : (
              <>
                <Paperclip className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Clique para escolher arquivo</span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files; if (f?.length) startUpload(Array.from(f)); e.target.value = ""; }}
            />
          </label>

          {uploadBanner && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold ${
              uploadBanner.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
            }`}>
              {uploadBanner.type === "success" ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
              {uploadBanner.msg}
            </div>
          )}

          {fileUrls.length > 0 && (
            <ul className="space-y-1.5">
              {fileUrls.map((f) => (
                <li key={f.url} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{f.name}</span>
                  </div>
                  <button type="button" onClick={() => setFileUrls((prev) => prev.filter((x) => x.url !== f.url))} className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — feedback + botão */}
        <div className="px-5 pb-5 space-y-3">
          {sendBanner && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
              sendBanner.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
            }`}>
              {sendBanner.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{sendBanner.msg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || fileUrls.length === 0 || uploading || !patientId}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm shadow-emerald-500/20"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
            ) : (
              <><Send className="w-4 h-4" />Enviar via WhatsApp</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
