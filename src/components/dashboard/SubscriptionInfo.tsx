"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionData {
  statusAssinatura: string;
  dataFimAcesso: string | null;
  temAssinaturaRecorrente: boolean;
}

export default function SubscriptionInfo() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subscription/info")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancelar() {
    setCancelling(true);
    setError("");
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao cancelar.");
        return;
      }
      setCancelResult(json.data.dataFimAcesso);
      setData((prev) => prev ? { ...prev, dataFimAcesso: new Date(Date.now() + 30 * 864e5).toISOString(), asaasSubscriptionId: null, temAssinaturaRecorrente: false } : prev);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setCancelling(false);
      setShowModal(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando informações da assinatura...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cancelamentoPendente = !!data.dataFimAcesso;
  const dataFimFormatada = data.dataFimAcesso
    ? format(parseISO(data.dataFimAcesso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Assinatura</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Plano Clínica · R$ 120/mês</p>
            {cancelamentoPendente ? (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Acesso até {dataFimFormatada}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {data.temAssinaturaRecorrente ? "Renovação automática ativa" : "Ativo"}
                </span>
              </div>
            )}
          </div>

          {!cancelamentoPendente && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
            >
              Cancelar assinatura
            </button>
          )}
        </div>

        {cancelResult && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-lg px-3 py-2">
            Cancelamento confirmado. Seu acesso continua até {cancelResult}.
          </p>
        )}
      </div>

      {/* Modal de confirmação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Cancelar assinatura?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ao cancelar, você ainda terá <strong>30 dias de acesso completo</strong> à plataforma. Após esse período, sua conta será bloqueada.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Manter assinatura
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {cancelling ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Cancelando...</> : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
