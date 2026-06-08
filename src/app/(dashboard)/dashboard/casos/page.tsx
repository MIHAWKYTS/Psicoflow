"use client";

import { useEffect, useState } from "react";

export default function CasosPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [hipoteses, setHipoteses] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");

  async function fetchCases() {
    const res = await fetch("/api/clinical-cases");
    const data = await res.json();
    setCases(data.data || []);
  }

  useEffect(() => {
    fetchCases();
  }, []);

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/clinical-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descricao,
        hipoteses,
        documentosUrls: [],
      }),
    });

    if (res.ok) {
      setTitulo("");
      setDescricao("");
      setHipoteses("");
      fetchCases();
    }
  }

  async function handleAttachDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCaseId || !documentUrl) return;

    const res = await fetch(`/api/clinical-cases/${selectedCaseId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentUrl }),
    });

    if (res.ok) {
      setDocumentUrl("");
      fetchCases();
    }
  }

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

      <form
        onSubmit={handleCreateCase}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do caso"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          required
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição resumida"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <input
          value={hipoteses}
          onChange={(e) => setHipoteses(e.target.value)}
          placeholder="Hipóteses diagnósticas"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold md:col-span-3">
          Criar caso
        </button>
      </form>

      <form
        onSubmit={handleAttachDocument}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          required
        >
          <option value="">Selecione um caso</option>
          {cases.map((clinicalCase) => (
            <option key={clinicalCase.id} value={clinicalCase.id}>
              {clinicalCase.titulo}
            </option>
          ))}
        </select>
        <input
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          placeholder="URL do documento"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          required
        />
        <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">
          Anexar documento
        </button>
      </form>

      <div className="space-y-3">
        {cases.map((clinicalCase) => (
          <div
            key={clinicalCase.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <h2 className="font-bold text-slate-700 dark:text-slate-200">{clinicalCase.titulo}</h2>
            {clinicalCase.descricao ? (
              <p className="text-sm text-slate-500 mt-1">{clinicalCase.descricao}</p>
            ) : null}
            {clinicalCase.hipoteses ? (
              <p className="text-xs text-slate-500 mt-2">
                <strong>Hipóteses:</strong> {clinicalCase.hipoteses}
              </p>
            ) : null}
            <ul className="mt-2 space-y-1">
              {clinicalCase.documentosUrls.map((doc: string) => (
                <li key={doc}>
                  <a
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:underline"
                  >
                    {doc}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
