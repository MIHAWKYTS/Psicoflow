"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  CreditCard,
  FileText,
  Lock,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  Phone,
  ShieldCheck,
} from "lucide-react";

// Mock das informações de um paciente para renderização visual
const MOCK_PATIENT = {
  id: "p1",
  nome: "Ana Beatriz Silva",
  telefoneWhatsapp: "(11) 98765-4321",
  status: "ativo",
  frequenciaSessoes: "semanal",
  valorSessaoPadrao: 150.00,
  email: "anabeatriz@email.com",
  nascimento: "1994-08-12",
};

// Mock de Prontuários Clinicos
const MOCK_CLINICAL_RECORDS = [
  {
    id: "cr1",
    conteudo: "Paciente relatou melhora significativa na ansiedade após adotar técnicas cognitivas de respiração discutidas na sessão passada. Conversamos sobre gatilhos profissionais.",
    createdAt: "2026-05-15T14:30:00Z",
    autor: "Dr. Psicólogo",
  },
  {
    id: "cr2",
    conteudo: "Primeira sessão de anamnese. Coleta de dados gerais. Paciente apresenta queixas recorrentes de insônia e estresse elevado devido à sobrecarga de trabalho.",
    createdAt: "2026-05-08T09:00:00Z",
    autor: "Dr. Psicólogo",
  },
];

// Mock do Histórico Financeiro
const MOCK_FINANCIALS = [
  {
    id: "f1",
    descricao: "Sessão de Psicoterapia - Quarta-feira",
    valor: 150.00,
    dataVencimento: "2026-05-15",
    status: "pago",
  },
  {
    id: "f2",
    descricao: "Sessão de Psicoterapia - Quarta-feira",
    valor: 150.00,
    dataVencimento: "2026-05-08",
    status: "pago",
  },
  {
    id: "f3",
    descricao: "Sessão de Psicoterapia - Quarta-feira",
    valor: 150.00,
    dataVencimento: "2026-05-22",
    status: "pendente",
  },
];

export default function PacientePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"dados" | "financeiro" | "prontuario">("dados");

  // Configuração rápida da role para simulação de LGPD
  // Em produção, isso virá dos headers ou do contexto de autenticação do back-end
  const [userRole, setUserRole] = useState<"psicologo_admin" | "secretaria">("psicologo_admin");

  const [patient, setPatient] = useState(MOCK_PATIENT);
  const [records, setRecords] = useState(MOCK_CLINICAL_RECORDS);
  const [financials, setFinancials] = useState(MOCK_FINANCIALS);
  
  const [newRecordContent, setNewRecordContent] = useState("");
  const [newFinancialDesc, setNewFinancialDesc] = useState("");
  const [newFinancialVal, setNewFinancialVal] = useState("150");

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Dados pessoais atualizados com sucesso! (Simulado)");
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordContent.trim()) return;

    const newRecord = {
      id: `cr-${Date.now()}`,
      conteudo: newRecordContent,
      createdAt: new Date().toISOString(),
      autor: "Dr. Psicólogo",
    };

    setRecords([newRecord, ...records]);
    setNewRecordContent("");
    alert("Evolução clínica registrada com sucesso!");
  };

  const handleAddFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinancialDesc.trim() || !newFinancialVal) return;

    const newTransaction = {
      id: `f-${Date.now()}`,
      descricao: newFinancialDesc,
      valor: parseFloat(newFinancialVal),
      dataVencimento: new Date().toISOString().split("T")[0],
      status: "pendente",
    };

    setFinancials([newTransaction, ...financials]);
    setNewFinancialDesc("");
    alert("Lançamento financeiro pendente registrado!");
  };

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

        {/* Simulador de Role para demonstração da LGPD */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl self-start border border-slate-200/50 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2">Visualizar como:</span>
          <button
            onClick={() => setUserRole("psicologo_admin")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              userRole === "psicologo_admin"
                ? "bg-white dark:bg-slate-800 text-sky-500 shadow-sm"
                : "text-slate-550 dark:text-slate-400"
            }`}
          >
            Psicólogo
          </button>
          <button
            onClick={() => setUserRole("secretaria")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              userRole === "secretaria"
                ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
                : "text-slate-550 dark:text-slate-400"
            }`}
          >
            Secretária
          </button>
        </div>
      </div>

      {/* Seletor de Abas */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "dados"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
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
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
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
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Frequência das Sessões
                </label>
                <select
                  value={patient.frequenciaSessoes}
                  onChange={(e) => setPatient({ ...patient, frequenciaSessoes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Salvar Alterações
            </button>
          </form>
        )}

        {/* ABA: HISTÓRICO FINANCEIRO */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            {/* Lançamento Rápido de Recebível */}
            {userRole === "psicologo_admin" && (
              <form onSubmit={handleAddFinancial} className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Descrição do Lançamento</label>
                  <input
                    type="text"
                    placeholder="Sessão Extra, Consulta, etc..."
                    value={newFinancialDesc}
                    onChange={(e) => setNewFinancialDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div className="w-full md:w-40 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                  <input
                    type="number"
                    value={newFinancialVal}
                    onChange={(e) => setNewFinancialVal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all w-full md:w-auto h-9 cursor-pointer"
                >
                  Lançar Recebível
                </button>
              </form>
            )}

            {/* Lista Financeira do Paciente */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {financials.map((trans) => (
                <div key={trans.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {trans.descricao}
                    </h4>
                    <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Vencimento: {new Date(trans.dataVencimento).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">
                      R$ {trans.valor.toFixed(2)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                        trans.status === "pago"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                      }`}
                    >
                      {trans.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                <div className="p-4 rounded-xl border border-sky-500/10 bg-sky-500/5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      Ambiente Clínico Criptografado e Seguro
                    </h4>
                    <p className="text-[10px] text-sky-500 leading-relaxed">
                      Sua sessão está em conformidade com as diretrizes do CFP e da LGPD. Todos os dados abaixo estão salvos com encriptação em trânsito e em repouso.
                    </p>
                  </div>
                </div>

                {/* Nova Evolução Clínica */}
                <form onSubmit={handleAddRecord} className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Registrar Evolução Clínica
                  </label>
                  <textarea
                    placeholder="Escreva como foi o andamento da sessão, comportamento relatado, intervenções clínicas aplicadas..."
                    rows={4}
                    value={newRecordContent}
                    onChange={(e) => setNewRecordContent(e.target.value)}
                    className="w-full p-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Gravar Prontuário</span>
                  </button>
                </form>

                {/* Lista de Prontuários Passados */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Histórico de Evoluções
                  </h4>

                  <div className="space-y-4">
                    {records.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">Autor: {rec.autor}</span>
                          <span>{new Date(rec.createdAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-300 font-medium">
                          {rec.conteudo}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
