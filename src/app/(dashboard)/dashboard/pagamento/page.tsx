"use client";

import { useState } from "react";
import { Check, CreditCard, QrCode, FileText, Loader2, Sparkles } from "lucide-react";

const FEATURES = [
  "Agenda completa com notificações",
  "Prontuário clínico digital (LGPD)",
  "Gestão financeira e recebíveis",
  "WhatsApp integrado para lembretes",
  "Gestão de equipe (admin + psicólogos + secretária)",
  "Controle de estoque",
  "Evolução clínica estruturada",
  "Casos clínicos e materiais de engajamento",
  "Dashboard com métricas da clínica",
  "Suporte via WhatsApp",
];

const BILLING_OPTIONS = [
  { value: "PIX", label: "PIX", icon: QrCode, description: "Aprovação imediata" },
  { value: "BOLETO", label: "Boleto", icon: FileText, description: "Vence em 1 dia útil" },
  { value: "CREDIT_CARD", label: "Cartão de crédito", icon: CreditCard, description: "Pague na página Asaas" },
] as const;

type BillingType = typeof BILLING_OPTIONS[number]["value"];

export default function PagamentoPage() {
  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAssinar() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar link de pagamento.");
        return;
      }

      window.location.href = data.data.invoiceUrl;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            Período de teste encerrado
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Continue usando o PsiGen
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assine agora e mantenha acesso completo à sua clínica.
          </p>
        </div>

        {/* Card de plano */}
        <div className="rounded-2xl border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10 p-6 space-y-5">

          {/* Preço */}
          <div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
              Plano Clínica
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-400">R$</span>
              <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">120</span>
              <span className="text-base font-semibold text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Cancele quando quiser. Sem fidelidade.</p>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Forma de pagamento
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BILLING_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = billingType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setBillingType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <p className="text-xs text-rose-500 text-center">{error}</p>
          )}

          {/* Botão */}
          <button
            onClick={handleAssinar}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando link...
              </>
            ) : (
              "Assinar agora — R$ 120/mês"
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Você será redirecionado para a página de pagamento segura do Asaas.
          </p>
        </div>
      </div>
    </div>
  );
}
