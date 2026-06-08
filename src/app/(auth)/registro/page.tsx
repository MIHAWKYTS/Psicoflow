"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Briefcase, FileText, Loader2, ArrowRight } from "lucide-react";

export default function RegistroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [documento, setDocumento] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha || !nomeClinica || !documento) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          senha,
          nomeClinica,
          documento,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro ao realizar o cadastro.");
      }

      // Redireciona para o login ou dashboard após o cadastro
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor. Verifique se o banco de dados está ativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Crie a sua conta
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Inicie o seu teste gratuito de 30 dias agora mesmo. Sem cartão de crédito.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do Psicólogo */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Seu Nome Profissional
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Dr. Psicólogo Exemplo"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Nome da Clínica / Consultório */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Nome da Clínica / Consultório (Tenant)
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={nomeClinica}
              onChange={(e) => setNomeClinica(e.target.value)}
              placeholder="Espaço Psicologia Integrada"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Documento CPF / CNPJ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Documento (CPF ou CNPJ)
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Apenas números"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            E-mail Profissional
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.com"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Crie sua senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              minLength={6}
              required
            />
          </div>
        </div>

        {/* Botão Registrar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/20 active:scale-98 transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Registrar e Começar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link de Login */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Já possui registro no PsicoFlow?{" "}
          <Link
            href="/login"
            className="font-bold text-sky-500 hover:text-sky-600 transition-colors"
          >
            Faça login aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
