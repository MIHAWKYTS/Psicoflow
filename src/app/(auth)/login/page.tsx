"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(String(data.error || data.message || "E-mail ou senha incorretos."));
      }

      // Redireciona para o dashboard em caso de sucesso
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Erro capturado no login:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Erro de conexão com o servidor. Verifique se o banco de dados está ativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Bem-vindo de volta!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Entre com as suas credenciais para gerenciar a sua clínica.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.com"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha secreta"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link para criar conta */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ainda não tem conta no PsicoFlow?{" "}
          <Link
            href="/registro"
            className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Experimente Grátis por 15 dias
          </Link>
        </p>
      </div>
    </div>
  );
}
