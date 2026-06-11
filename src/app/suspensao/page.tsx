"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, MessageCircle, CreditCard, LogOut } from "lucide-react";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5582988042042";

function waLink(message: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function SuspensaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full space-y-6">

        {/* Ícone + título */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-rose-500/10">
              <ShieldOff className="w-10 h-10 text-rose-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Conta Suspensa
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              O acesso à sua clínica foi suspenso. Regularize sua assinatura ou
              entre em contato com o suporte para reativar.
            </p>
          </div>
        </div>

        {/* Card — regularizar assinatura */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Regularizar assinatura
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Para reativar sua conta, entre em contato com nossa equipe pelo
            WhatsApp. Aceitamos cartão de crédito, débito e PIX.
          </p>
          <a
            href={waLink(
              "Olá! Gostaria de regularizar minha assinatura do PsiGen e reativar minha conta."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Regularizar via WhatsApp
          </a>
        </div>

        {/* Card — suporte */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Falar com suporte
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dúvidas ou acredita que houve um engano?
          </p>
          <div className="flex items-center gap-3">
            <a
              href={waLink(
                "Olá! Preciso de ajuda com minha conta no PsiGen. Minha conta foi suspensa."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              WhatsApp
            </a>
            <a
              href="mailto:suporte@psigen.com.br"
              className="flex items-center justify-center flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
            >
              suporte@psigen.com.br
            </a>
          </div>
        </div>

        {/* Sair */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-50 text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {loading ? "Saindo..." : "Sair da conta"}
        </button>

      </div>
    </div>
  );
}
