"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  FileText,
  ClipboardList,
  Stethoscope,
  Target,
  BookOpen,
  CheckSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import EvolucaoForm from "./EvolucaoForm";

type Patient = {
  id: string;
  nome: string;
  cpf?: string | null;
  telefoneWhatsapp?: string | null;
  dataNascimento?: Date | string | null;
  email?: string | null;
};

type ClinicalRecord = {
  id: string;
  contratoTerapeutico?: string | null;
  anamnese?: string | null;
  avaliacaoHipotese?: string | null;
  planoTrabalho?: string | null;
  encerramento?: string | null;
  dataEncerramento?: string | null;
};

type Evolution = {
  id: string;
  dataHora: string;
  temas: string;
  intervencoes: string;
  respostaPaciente?: string | null;
  encaminhamentos?: string | null;
  autor?: { nome: string } | null;
};

type BlockSaveState = "idle" | "saving" | "saved" | "error";

const BLOCK_FIELDS = [
  "contratoTerapeutico",
  "anamnese",
  "avaliacaoHipotese",
  "planoTrabalho",
  "encerramento",
  "dataEncerramento",
] as const;

type BlockField = (typeof BLOCK_FIELDS)[number];

const BLOCK_META: Record<string, { icon: React.ElementType; title: string; placeholder: string; multiline: boolean }> = {
  contratoTerapeutico: {
    icon: FileText,
    title: "Contrato Terapêutico",
    placeholder: "Descreva os objetivos acordados, frequência das sessões, regras de cancelamento...",
    multiline: true,
  },
  anamnese: {
    icon: ClipboardList,
    title: "Anamnese",
    placeholder: "Histórico do paciente, queixa principal, contexto familiar, histórico de saúde...",
    multiline: true,
  },
  avaliacaoHipotese: {
    icon: Stethoscope,
    title: "Avaliação e Hipótese Diagnóstica",
    placeholder: "Observações clínicas, hipóteses diagnósticas, instrumentos utilizados...",
    multiline: true,
  },
  planoTrabalho: {
    icon: Target,
    title: "Plano de Trabalho",
    placeholder: "Abordagem terapêutica, metas de curto e longo prazo, técnicas a utilizar...",
    multiline: true,
  },
  encerramento: {
    icon: CheckSquare,
    title: "Encerramento",
    placeholder: "Motivo do encerramento, evolução observada, encaminhamentos finais...",
    multiline: true,
  },
};

export default function ProntuarioForm({ patient }: { patient: Patient }) {
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [blockValues, setBlockValues] = useState<Record<BlockField, string>>({
    contratoTerapeutico: "",
    anamnese: "",
    avaliacaoHipotese: "",
    planoTrabalho: "",
    encerramento: "",
    dataEncerramento: "",
  });
  const [blockStates, setBlockStates] = useState<Record<BlockField, BlockSaveState>>({
    contratoTerapeutico: "idle",
    anamnese: "idle",
    avaliacaoHipotese: "idle",
    planoTrabalho: "idle",
    encerramento: "idle",
    dataEncerramento: "idle",
  });
  const savedValues = useRef<Record<BlockField, string>>({ ...blockValues });

  useEffect(() => {
    fetch(`/api/clinical-records?patientId=${patient.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          const r: ClinicalRecord = d.data[0];
          setRecord(r);
          setRecordId(r.id);
          const vals: Record<BlockField, string> = {
            contratoTerapeutico: r.contratoTerapeutico ?? "",
            anamnese: r.anamnese ?? "",
            avaliacaoHipotese: r.avaliacaoHipotese ?? "",
            planoTrabalho: r.planoTrabalho ?? "",
            encerramento: r.encerramento ?? "",
            dataEncerramento: r.dataEncerramento
              ? new Date(r.dataEncerramento).toISOString().split("T")[0]
              : "",
          };
          setBlockValues(vals);
          savedValues.current = { ...vals };
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRecord(false));
  }, [patient.id]);

  useEffect(() => {
    if (!recordId) return;
    setLoadingEvolutions(true);
    fetch(`/api/clinical-records/${recordId}/evolutions`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setEvolutions(d.data ?? []); })
      .catch(() => {})
      .finally(() => setLoadingEvolutions(false));
  }, [recordId]);

  const saveBlock = async (field: BlockField, value: string) => {
    if (value === savedValues.current[field]) return;

    setBlockStates((prev) => ({ ...prev, [field]: "saving" }));

    try {
      let rid = recordId;

      if (!rid) {
        // Upsert: cria o record na primeira edição
        const body: Record<string, string> = { patientId: patient.id };
        body[field] = value;
        if (field === "dataEncerramento") {
          body["dataEncerramento"] = value ? new Date(value).toISOString() : "";
        }
        const res = await fetch("/api/clinical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        rid = d.data.id;
        setRecordId(rid!);
      } else {
        const body: Record<string, string | null> = { patientId: patient.id };
        body[field] = value || null;
        if (field === "dataEncerramento") {
          body["dataEncerramento"] = value ? new Date(value).toISOString() : null;
        }
        const res = await fetch(`/api/clinical-records/${rid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
      }

      savedValues.current[field] = value;
      setBlockStates((prev) => ({ ...prev, [field]: "saved" }));
      setTimeout(() => setBlockStates((prev) => ({ ...prev, [field]: "idle" })), 2000);
    } catch {
      setBlockStates((prev) => ({ ...prev, [field]: "error" }));
    }
  };

  const handleEvolutionAdded = (ev: Evolution) => {
    setEvolutions((prev) => [ev, ...prev]);
  };

  const formatDate = (val?: string | Date | null) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("pt-BR");
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500";

  const BlockSaveIndicator = ({ state }: { state: BlockSaveState }) => {
    if (state === "idle") return null;
    if (state === "saving") return <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />;
    if (state === "saved") return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
  };

  const sectionClass =
    "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-3";
  const sectionTitleClass =
    "flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider";

  if (loadingRecord) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Bloco 1 — Identificação */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <User className="w-4 h-4 text-sky-500" />
          Identificação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nome</p>
            <p className="text-slate-800 dark:text-slate-100 font-medium">{patient.nome}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CPF</p>
            <p className="text-slate-800 dark:text-slate-100">{patient.cpf ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data de Nascimento</p>
            <p className="text-slate-800 dark:text-slate-100">{formatDate(patient.dataNascimento as string | null)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp</p>
            <p className="text-slate-800 dark:text-slate-100">{patient.telefoneWhatsapp ?? "—"}</p>
          </div>
          {patient.email && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">E-mail</p>
              <p className="text-slate-800 dark:text-slate-100">{patient.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Blocos 2–5 */}
      {(["contratoTerapeutico", "anamnese", "avaliacaoHipotese", "planoTrabalho"] as BlockField[]).map((field) => {
        const meta = BLOCK_META[field];
        const Icon = meta.icon;
        return (
          <div key={field} className={sectionClass}>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleClass}>
                <Icon className="w-4 h-4 text-sky-500" />
                {meta.title}
              </h2>
              <BlockSaveIndicator state={blockStates[field]} />
            </div>
            <textarea
              rows={5}
              value={blockValues[field]}
              placeholder={meta.placeholder}
              onChange={(e) => setBlockValues((prev) => ({ ...prev, [field]: e.target.value }))}
              onBlur={(e) => saveBlock(field, e.target.value)}
              className={inputClass}
            />
          </div>
        );
      })}

      {/* Bloco 6 — Evoluções */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <BookOpen className="w-4 h-4 text-sky-500" />
          Evoluções
        </h2>

        {/* Formulário de nova evolução */}
        <EvolucaoForm
          recordId={recordId}
          patientId={patient.id}
          onRecordCreated={(id) => setRecordId(id)}
          onEvolutionAdded={handleEvolutionAdded}
        />

        {/* Lista */}
        {loadingEvolutions ? (
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mt-2" />
        ) : evolutions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            Nenhuma evolução registrada ainda.
          </p>
        ) : (
          <div className="space-y-3 mt-2">
            {evolutions.map((ev) => (
              <div
                key={ev.id}
                className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>{new Date(ev.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                  {ev.autor && <span>{ev.autor.nome}</span>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Temas</p>
                  <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{ev.temas}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Intervenções</p>
                  <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{ev.intervencoes}</p>
                </div>
                {ev.respostaPaciente && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Resposta do Paciente</p>
                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{ev.respostaPaciente}</p>
                  </div>
                )}
                {ev.encaminhamentos && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Encaminhamentos</p>
                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{ev.encaminhamentos}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bloco 7 — Encerramento */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleClass}>
            <CheckSquare className="w-4 h-4 text-sky-500" />
            Encerramento
          </h2>
          <BlockSaveIndicator state={blockStates["encerramento"]} />
        </div>
        <textarea
          rows={4}
          value={blockValues["encerramento"]}
          placeholder={BLOCK_META["encerramento"].placeholder}
          onChange={(e) => setBlockValues((prev) => ({ ...prev, encerramento: e.target.value }))}
          onBlur={(e) => saveBlock("encerramento", e.target.value)}
          className={inputClass}
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Data de Encerramento
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={blockValues["dataEncerramento"]}
              onChange={(e) => setBlockValues((prev) => ({ ...prev, dataEncerramento: e.target.value }))}
              onBlur={(e) => saveBlock("dataEncerramento", e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            <BlockSaveIndicator state={blockStates["dataEncerramento"]} />
          </div>
        </div>
      </div>
    </div>
  );
}
