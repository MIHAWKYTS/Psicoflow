"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Phone, Calendar, CreditCard, ChevronRight, X, Loader2 } from "lucide-react";

type Patient = {
  id: string;
  nome: string;
  status: string;
  telefoneWhatsapp?: string | null;
  frequenciaSessoes?: string | null;
  valorSessaoPadrao?: number | null;
};

const EMPTY_FORM = {
  nome: "",
  telefoneWhatsapp: "",
  email: "",
  cpf: "",
  frequenciaSessoes: "semanal",
  valorSessaoPadrao: "",
  status: "ativo",
};

const inputClass =
  "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchPatients() {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const resData = await response.json();
        setPatients(resData.data?.items || []);
      }
    } catch (error) {
      console.error("Erro ao buscar pacientes", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  function openModal() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setFormError("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        status: form.status,
      };
      if (form.telefoneWhatsapp.trim()) body.telefoneWhatsapp = form.telefoneWhatsapp.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.cpf.trim()) body.cpf = form.cpf.trim();
      if (form.frequenciaSessoes) body.frequenciaSessoes = form.frequenciaSessoes;
      if (form.valorSessaoPadrao) body.valorSessaoPadrao = parseFloat(form.valorSessaoPadrao);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Erro ao cadastrar paciente.");
        return;
      }

      setPatients((prev) => [data.data, ...prev]);
      closeModal();
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow active:scale-98 transition-all w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="todos">Todos Status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Grid de Pacientes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Link
                key={patient.id}
                href={`/dashboard/pacientes/${patient.id}`}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
              >
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
                  <ChevronRight className="w-5 h-5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{patient.telefoneWhatsapp || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Frequência: <strong className="capitalize">{patient.frequenciaSessoes || "—"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Sessão: <strong>R$ {patient.valorSessaoPadrao != null ? Number(patient.valorSessaoPadrao).toFixed(2) : "—"}</strong></span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              Nenhum paciente encontrado.
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Painel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-slate-800 dark:text-white text-base">
                Novo Paciente
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form id="cadastro-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex: Maria da Silva"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.telefoneWhatsapp}
                    onChange={(e) => set("telefoneWhatsapp", maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={inputClass}
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => set("cpf", maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="paciente@email.com"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Frequência */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Frequência
                  </label>
                  <select
                    value={form.frequenciaSessoes}
                    onChange={(e) => set("frequenciaSessoes", e.target.value)}
                    className={inputClass}
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                {/* Valor da sessão */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Valor da Sessão (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valorSessaoPadrao}
                    onChange={(e) => set("valorSessaoPadrao", e.target.value)}
                    placeholder="150,00"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className={inputClass}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Erro */}
              {formError && (
                <p className="text-xs text-rose-500 font-medium">{formError}</p>
              )}
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="cadastro-form"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold transition-all"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Salvando..." : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
