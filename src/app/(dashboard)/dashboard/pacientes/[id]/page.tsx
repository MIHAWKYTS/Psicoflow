"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  CreditCard,
  FileText,
  Lock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function PacientePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"dados" | "financeiro" | "prontuario">("dados");

  const [currentUser, setCurrentUser] = useState<{ nome: string; role: string } | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [financials, setFinancials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Fetch patient + authenticated user in parallel
  useEffect(() => {
    async function fetchData() {
      try {
        const [patientRes, meRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch("/api/auth/me"),
        ]);
        if (patientRes.ok) {
          const resData = await patientRes.json();
          const pat = resData.data || null;
          setPatient(pat);
          if (pat?.valorSessaoPadrao != null) {
            setNewFinancialVal(String(pat.valorSessaoPadrao));
          }
        }
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser({
            nome: meData.data?.nome ?? "",
            role: meData.data?.role ?? "",
          });
        }
      } catch (err) {
        console.error("Erro ao buscar dados", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Fetch patient financial transactions on mount
  useEffect(() => {
    async function fetchFinancials() {
      setFinancialLoading(true);
      try {
        const res = await fetch(`/api/financial?patientId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setFinancials(data.data?.items ?? []);
        }
      } catch (err) {
        console.error("Erro ao buscar financeiro", err);
      } finally {
        setFinancialLoading(false);
      }
    }
    fetchFinancials();
  }, [id]);

  // Dados pessoais
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Formulário financeiro
  const [newFinancialDesc, setNewFinancialDesc] = useState("");
  const [newFinancialVal, setNewFinancialVal] = useState("0");
  const [newFinancialTipo, setNewFinancialTipo] = useState<"receita" | "despesa">("receita");
  const [newFinancialCategoria, setNewFinancialCategoria] = useState<"consultorio" | "pessoal">("consultorio");
  const [newFinancialDataVenc, setNewFinancialDataVenc] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newFinancialJaPago, setNewFinancialJaPago] = useState(true);
  const [newFinancialForma, setNewFinancialForma] = useState<"dinheiro" | "pix" | "cartao">("pix");
  const [newFinancialParcelas, setNewFinancialParcelas] = useState(1);
  const [financialSaving, setFinancialSaving] = useState(false);
  const [financialError, setFinancialError] = useState("");

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const body: Record<string, unknown> = {
        nome: patient.nome,
        status: patient.status,
      };
      if (patient.telefoneWhatsapp) body.telefoneWhatsapp = patient.telefoneWhatsapp;
      if (patient.email) body.email = patient.email;
      if (patient.cpf) body.cpf = patient.cpf;
      if (patient.frequenciaSessoes) body.frequenciaSessoes = patient.frequenciaSessoes;
      if (patient.valorSessaoPadrao != null) body.valorSessaoPadrao = Number(patient.valorSessaoPadrao);

      const res = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || "Erro ao salvar alterações.");
        return;
      }

      setPatient(data.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinancialDesc.trim() || !newFinancialVal) return;

    setFinancialSaving(true);
    setFinancialError("");
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: id,
          tipo: newFinancialTipo,
          categoria: newFinancialCategoria,
          descricao: newFinancialDesc,
          valor: parseFloat(newFinancialVal),
          statusPagamento: newFinancialJaPago ? "pago" : "pendente",
          dataVencimento: newFinancialDataVenc,
          formaPagamento: newFinancialForma,
          parcelas: newFinancialForma === "cartao" ? newFinancialParcelas : 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFinancialError(data.error || "Erro ao registrar lançamento.");
        return;
      }

      setFinancials((prev) => [data.data, ...prev]);
      setNewFinancialDesc("");
      setNewFinancialVal(String(patient?.valorSessaoPadrao ?? 0));
      setNewFinancialDataVenc(new Date().toISOString().split("T")[0]);
      setNewFinancialJaPago(true);
      setNewFinancialForma("pix");
      setNewFinancialParcelas(1);
    } catch {
      setFinancialError("Erro de conexão. Tente novamente.");
    } finally {
      setFinancialSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando dados do paciente...</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center text-rose-500">Paciente não encontrado.</div>;
  }

  const userRole = currentUser?.role ?? "";

  return (
    <div className="space-y-6">
      {/* Botão voltar e Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pacientes"
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
              {patient.nome}
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-550">
              Prontuário e Ficha de Acompanhamento
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Abas */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "dados"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados Pessoais</span>
        </button>

        <button
          onClick={() => setActiveTab("financeiro")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "financeiro"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab("prontuario")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === "prontuario"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Prontuário Clínico</span>
          {userRole === "secretaria" && (
            <Lock className="w-3 h-3 text-rose-500 ml-1.5 shrink-0" />
          )}
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">

        {/* ABA: DADOS PESSOAIS */}
        {activeTab === "dados" && (
          <form onSubmit={handleSavePatient} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={patient.nome}
                  onChange={(e) => setPatient({ ...patient, nome: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  WhatsApp / Celular
                </label>
                <input
                  type="text"
                  value={patient.telefoneWhatsapp}
                  onChange={(e) => setPatient({ ...patient, telefoneWhatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  type="email"
                  value={patient.email}
                  onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={patient.nascimento}
                  onChange={(e) => setPatient({ ...patient, nascimento: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Frequência das Sessões
                </label>
                <select
                  value={patient.frequenciaSessoes}
                  onChange={(e) => setPatient({ ...patient, frequenciaSessoes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Valor Padrão da Sessão
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    value={patient.valorSessaoPadrao}
                    onChange={(e) => setPatient({ ...patient, valorSessaoPadrao: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Dados atualizados com sucesso!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "A guardar..." : "Salvar Alterações"}
            </button>
          </form>
        )}

        {/* ABA: HISTÓRICO FINANCEIRO */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            {/* Lançamento Rápido */}
            {userRole !== "secretaria" && (
              <form onSubmit={handleAddFinancial} className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Novo Lançamento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Descrição</label>
                    <input
                      type="text"
                      placeholder="Sessão, Consulta, etc..."
                      value={newFinancialDesc}
                      onChange={(e) => setNewFinancialDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFinancialVal}
                      onChange={(e) => setNewFinancialVal(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tipo</label>
                    <select
                      value={newFinancialTipo}
                      onChange={(e) => setNewFinancialTipo(e.target.value as "receita" | "despesa")}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categoria</label>
                    <select
                      value={newFinancialCategoria}
                      onChange={(e) => setNewFinancialCategoria(e.target.value as "consultorio" | "pessoal")}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="consultorio">Consultório</option>
                      <option value="pessoal">Pessoal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data</label>
                    <input
                      type="date"
                      value={newFinancialDataVenc}
                      onChange={(e) => setNewFinancialDataVenc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Forma de Pagamento</label>
                    <select
                      value={newFinancialForma}
                      onChange={(e) => setNewFinancialForma(e.target.value as "dinheiro" | "pix" | "cartao")}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                    </select>
                  </div>

                  {newFinancialForma === "cartao" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Parcelas</label>
                      <select
                        value={newFinancialParcelas}
                        onChange={(e) => setNewFinancialParcelas(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Toggle já pago */}
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <div
                    onClick={() => setNewFinancialJaPago((v) => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${newFinancialJaPago ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${newFinancialJaPago ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Já pago
                  </span>
                </label>

                {financialError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {financialError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={financialSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {financialSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {financialSaving ? "A registrar..." : "Adicionar"}
                  </button>
                </div>
              </form>
            )}

            {/* Lista Financeira do Paciente */}
            {financialLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              </div>
            ) : financials.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Nenhum lançamento financeiro registrado.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {financials.map((trans) => (
                  <div key={trans.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {trans.descricao}
                      </h4>
                      <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(trans.dataVencimento).toLocaleDateString("pt-BR")}
                        {trans.formaPagamento && (
                          <span className="ml-1 capitalize">
                            · {trans.formaPagamento === "cartao"
                                ? `Cartão${trans.parcelas > 1 ? ` ${trans.parcelas}x` : ""}`
                                : trans.formaPagamento === "pix" ? "Pix" : "Dinheiro"}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">
                        R$ {Number(trans.valor).toFixed(2)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                          trans.statusPagamento === "pago"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                        }`}
                      >
                        {trans.statusPagamento}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: PRONTUÁRIOS CLÍNICOS (LGPD PROTEGIDA) */}
        {activeTab === "prontuario" && (
          <div className="space-y-6">
            {userRole === "secretaria" ? (
              /* Bloqueio de Acesso LGPD */
              <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-500/5 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-6 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center justify-center shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-rose-800 dark:text-rose-450 text-base flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-650" />
                    Acesso Altamente Restrito (LGPD)
                  </h3>
                  <p className="text-xs text-rose-650 dark:text-rose-400 leading-relaxed font-medium">
                    De acordo com a Lei Geral de Proteção de Dados (LGPD) e o sigilo ético do Conselho Federal de Psicologia (CFP), prontuários clínicos só podem ser acessados e editados por psicólogos e profissionais de saúde autorizados. Seu perfil atual (<strong>Secretária</strong>) não possui permissão para visualizar estas evoluções.
                  </p>
                </div>
              </div>
            ) : (
              /* Acesso Autorizado do Psicólogo */
              <div className="space-y-6">
                {/* Cabeçalho da área restrita */}
                <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Ambiente Clínico Criptografado e Seguro
                    </h4>
                    <p className="text-[10px] text-indigo-500 leading-relaxed">
                      Sua sessão está em conformidade com as diretrizes do CFP e da LGPD. Todos os dados abaixo estão salvos com encriptação em trânsito e em repouso.
                    </p>
                  </div>
                </div>

                {/* Redirecionamento para página de prontuários */}
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Prontuários Clínicos
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                      Acesse a área de prontuários para registrar e consultar as evoluções clínicas deste paciente.
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/prontuarios/${id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Prontuário
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
