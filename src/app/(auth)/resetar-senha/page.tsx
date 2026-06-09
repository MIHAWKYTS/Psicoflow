"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

function ResetarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3 py-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Link inválido
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Este link de recuperação é inválido ou está incompleto.
          </p>
        </div>
        <Link
          href="/esqueci-senha"
          className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3 py-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Senha redefinida!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Sua senha foi atualizada com sucesso. Faça login com a nova senha.
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/10 transition-all"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Nova senha
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Escolha uma senha forte com pelo menos 6 caracteres.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
          {error}{" "}
          {(error.includes("expirado") || error.includes("utilizado") || error.includes("inválido")) && (
            <Link href="/esqueci-senha" className="underline ml-1">
              Solicitar novo link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              minLength={6}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Confirmar senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              minLength={6}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Redefinir senha"
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function ResetarSenhaPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400 text-center py-8">Carregando...</div>}>
      <ResetarSenhaForm />
    </Suspense>
  );
}
