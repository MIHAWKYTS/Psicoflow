"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";

export default function SuspensaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-rose-500/10">
            <ShieldOff className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Conta Suspensa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta conta foi suspensa. Entre em contato com o suporte para regularizar.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm text-slate-500 dark:text-slate-400">
          Suporte:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            suporte@psigen.com.br
          </span>
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full px-5 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {loading ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  );
}
