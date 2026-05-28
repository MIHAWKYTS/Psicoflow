"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Phone,
  Calendar,
  CreditCard,
  ChevronRight,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { CpfInput } from "@/components/dashboard/CpfInput";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  nome: string;
  cpf?: string | null;
  telefoneWhatsapp?: string | null;
  status: "ativo" | "inativo";
  frequenciaSessoes?: "semanal" | "quinzenal" | "mensal" | null;
  valorSessaoPadrao?: number | null;
}

interface FormData {
  nome: string;
  cpf: string;
  telefoneWhatsapp: string;
  frequenciaSessoes: "semanal" | "quinzenal" | "mensal" | "";
  valorSessaoPadrao: string;
  status: "ativo" | "inativo";
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  telefoneWhatsapp?: string;
  frequenciaSessoes?: string;
  valorSessaoPadrao?: string;
  general?: string;
}

const EMPTY_FORM: FormData = {
  nome: "",
  cpf: "",
  telefoneWhatsapp: "",
  frequenciaSessoes: "",
  valorSessaoPadrao: "",
  status: "ativo",
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function PatientCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PacientesPage() {
  // 7.1 — Estado da lista e carregamento
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  // 7.2 — Estado do drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // 7.1 — Buscar pacientes reais da API com suporte a cancelamento
  const fetchPatients = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/patients", { signal });
      if (!res.ok) throw new Error("Erro ao carregar pacientes.");
      const data = await res.json();
      setPatients(data.data ?? data);
    } catch (error: any) {
      // 3.5 — Ignorar erros de cancelamento intencional
      if (error.name === "AbortError") return;
      setFetchError("Não foi possível carregar os pacientes. Tente novamente.");
    } finally {
      // Se foi cancelado, podemos evitar parar o loading se preferir,
      // mas como o componente será desmontado ou substituído, o finally roda seguro
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 3.3 — Criar controlador
    const controller = new AbortController();
    
    // 3.4 — Passar o signal
    fetchPatients(controller.signal);
    
    // 3.6 — Cleanup
    return () => {
      controller.abort();
    };
  }, [fetchPatients]);

  // Filtros aplicados
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ─── 7.3 / 7.4 / 7.5 — Formulário de cadastro ─────────────────────────────

  function openDrawer() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!form.nome.trim() || form.nome.trim().length < 2) {
      errors.nome = "Nome é obrigatório (mínimo 2 caracteres).";
    }
    if (form.valorSessaoPadrao && isNaN(parseFloat(form.valorSessaoPadrao))) {
      errors.valorSessaoPadrao = "Valor deve ser um número válido.";
    }
    if (form.valorSessaoPadrao && parseFloat(form.valorSessaoPadrao) <= 0) {
      errors.valorSessaoPadrao = "Valor deve ser positivo.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // 7.4 — Conectar submit ao POST /api/patients
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormErrors({});

    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        status: form.status,
      };
      if (form.cpf) body.cpf = form.cpf.replace(/\D/g, "");
      if (form.telefoneWhatsapp) body.telefoneWhatsapp = form.telefoneWhatsapp;
      if (form.frequenciaSessoes) body.frequenciaSessoes = form.frequenciaSessoes;
      if (form.valorSessaoPadrao)
        body.valorSessaoPadrao = parseFloat(form.valorSessaoPadrao);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        // 7.5 — Exibir erros inline de validação da API
        setFormErrors({ general: json.error ?? "Erro ao cadastrar paciente." });
        return;
      }

      // 7.4 — Atualizar lista após sucesso
      const newPatient: Patient = json.data ?? json;
      setPatients((prev) => [newPatient, ...prev]);
      closeDrawer();
    } catch {
      setFormErrors({ general: "Erro de conexão. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── 7.6 / 7.7 — Toggle Ativo/Inativo otimista ────────────────────────────

  async function handleToggleStatus(e: React.MouseEvent, patient: Patient) {
    e.preventDefault(); // Impede navegação do Link pai

    const newStatus = patient.status === "ativo" ? "inativo" : "ativo";

    // Atualização otimista
    setPatients((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // 7.7 — Reverter em caso de erro
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patient.id ? { ...p, status: patient.status } : p
          )
        );
      }
    } catch {
      // Reverter em caso de erro de rede
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, status: patient.status } : p
        )
      );
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            Pacientes Cadastrados
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            Gerenciamento de fichas, históricos clínicos e dados de contato
          </p>
        </div>

        {/* 7.2 — Botão abre drawer */}
        <button
          type="button"
          id="btn-cadastrar-paciente"
          onClick={openDrawer}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow active:scale-98 transition-all w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Controles de filtro */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="todos">Todos Status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // 7.1 — Skeleton de carregamento
          Array.from({ length: 6 }).map((_, i) => <PatientCardSkeleton key={i} />)
        ) : fetchError ? (
          <div className="col-span-full bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 p-8 text-center text-red-500">
            {fetchError}
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="relative group">
              <Link
                href={`/dashboard/pacientes/${patient.id}`}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between block"
              >
                {/* Header do card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-base shrink-0">
                      {patient.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-500 transition-colors truncate">
                        {patient.nome}
                      </h3>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border mt-1 ${
                          patient.status === "ativo"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border-slate-100 dark:border-slate-800"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-350 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* Informações */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{patient.telefoneWhatsapp || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Frequência:{" "}
                      <strong className="capitalize">
                        {patient.frequenciaSessoes ?? "—"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Sessão:{" "}
                      <strong>
                        {patient.valorSessaoPadrao != null
                          ? `R$ ${Number(patient.valorSessaoPadrao).toFixed(2)}`
                          : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
              </Link>

              {/* 7.6 — Botão toggle Ativo/Inativo */}
              <button
                type="button"
                title={patient.status === "ativo" ? "Desativar paciente" : "Ativar paciente"}
                onClick={(e) => handleToggleStatus(e, patient)}
                className={`absolute top-3 right-10 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer ${
                  patient.status === "ativo"
                    ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {patient.status === "ativo" ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>

      {/* ─── 7.2 / 7.3 — Drawer de Cadastro ─────────────────────────────── */}
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Painel do Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Cadastrar Paciente"
        role="dialog"
        aria-modal="true"
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Novo Paciente
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha os dados do paciente
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form
          id="form-cadastro-paciente"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
          noValidate
        >
          {/* Erro geral */}
          {formErrors.general && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {formErrors.general}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-nome"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              id="patient-nome"
              type="text"
              placeholder="Ex: Ana Beatriz Silva"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 ${
                formErrors.nome
                  ? "border-red-400 dark:border-red-600"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            />
            {/* 7.5 — Erro inline */}
            {formErrors.nome && (
              <p className="text-xs text-red-500">{formErrors.nome}</p>
            )}
          </div>

          {/* CPF — 7.3 usa CpfInput */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-cpf"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              CPF <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <CpfInput
              id="patient-cpf"
              value={form.cpf}
              onChange={(val) => setForm((f) => ({ ...f, cpf: val }))}
            />
            {formErrors.cpf && (
              <p className="text-xs text-red-500">{formErrors.cpf}</p>
            )}
          </div>

          {/* Telefone WhatsApp */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-telefone"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Telefone WhatsApp
            </label>
            <input
              id="patient-telefone"
              type="tel"
              placeholder="(11) 98765-4321"
              value={form.telefoneWhatsapp}
              onChange={(e) =>
                setForm((f) => ({ ...f, telefoneWhatsapp: e.target.value }))
              }
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Frequência */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-frequencia"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Frequência de sessões
            </label>
            <select
              id="patient-frequencia"
              value={form.frequenciaSessoes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequenciaSessoes: e.target.value as FormData["frequenciaSessoes"],
                }))
              }
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="">Selecionar frequência...</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          {/* Valor padrão */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-valor"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Valor padrão da sessão (R$)
            </label>
            <input
              id="patient-valor"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 150.00"
              value={form.valorSessaoPadrao}
              onChange={(e) =>
                setForm((f) => ({ ...f, valorSessaoPadrao: e.target.value }))
              }
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 ${
                formErrors.valorSessaoPadrao
                  ? "border-red-400 dark:border-red-600"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            />
            {formErrors.valorSessaoPadrao && (
              <p className="text-xs text-red-500">{formErrors.valorSessaoPadrao}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient-status"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Status inicial
            </label>
            <select
              id="patient-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "ativo" | "inativo",
                }))
              }
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </form>

        {/* Rodapé do Drawer */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-cadastro-paciente"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Cadastrar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
