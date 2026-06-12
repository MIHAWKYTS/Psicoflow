"use client";

import { useState } from "react";
import { CreditCard, QrCode, Loader2 } from "lucide-react";

type BillingType = "CREDIT_CARD" | "PIX";

interface Props {
  label?: string;
}

export default function CheckoutButtons({ label = "Assinar" }: Props) {
  const [loading, setLoading] = useState<BillingType | null>(null);
  const [error, setError] = useState("");

  async function handleCheckout(billingType: BillingType) {
    setLoading(billingType);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao gerar link de pagamento.");
        setLoading(null);
        return;
      }
      window.location.href = json.data.paymentUrl;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleCheckout("PIX")}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading === "PIX" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <QrCode className="w-4 h-4" />
          )}
          {label} com PIX
        </button>

        <button
          onClick={() => handleCheckout("CREDIT_CARD")}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
        >
          {loading === "CREDIT_CARD" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {label} com Cartão
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-500 text-center bg-rose-50 dark:bg-rose-950/20 rounded-lg py-2 px-3">
          {error}
        </p>
      )}
    </div>
  );
}
