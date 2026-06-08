"use client";

import { useEffect, useState } from "react";

export default function EngajamentoPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [assunto, setAssunto] = useState("Material complementar da sessão");
  const [mensagem, setMensagem] = useState("");
  const [links, setLinks] = useState("");
  const [pdfUrls, setPdfUrls] = useState("");
  const [enviarAutomaticamente, setEnviarAutomaticamente] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function loadPatients() {
      const res = await fetch("/api/patients");
      const data = await res.json();
      const rows = data.data?.items || data.data || [];
      setPatients(rows);
      if (rows[0]?.id) {
        setPatientId(rows[0].id);
      }
    }
    loadPatients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");

    const payload = {
      patientId,
      assunto,
      mensagem,
      links: links
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      pdfUrls: pdfUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      enviarAutomaticamente,
    };

    const res = await fetch("/api/engagement/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error || "Falha ao enviar material");
      return;
    }

    setFeedback("Material enviado com sucesso.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Engajamento pós-sessão
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Configure e envie materiais terapêuticos por e-mail.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        >
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.nome}
            </option>
          ))}
        </select>

        <input
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Assunto do e-mail"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          required
        />

        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem de acompanhamento"
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          required
        />

        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="Links (1 por linha)"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <textarea
          value={pdfUrls}
          onChange={(e) => setPdfUrls(e.target.value)}
          placeholder="URLs de PDF (1 por linha)"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={enviarAutomaticamente}
            onChange={(e) => setEnviarAutomaticamente(e.target.checked)}
          />
          Marcar como envio automático
        </label>

        <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold">
          Enviar material
        </button>
      </form>

      {feedback ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{feedback}</p>
      ) : null}
    </div>
  );
}
