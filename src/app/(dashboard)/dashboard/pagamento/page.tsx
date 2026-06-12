"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, CheckCircle2, CreditCard, QrCode, FileText,
  Loader2, Sparkles, Copy, ExternalLink,
} from "lucide-react";

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
  { value: "CREDIT_CARD", label: "Cartão", icon: CreditCard, description: "Via página segura" },
] as const;

type BillingType = typeof BILLING_OPTIONS[number]["value"];
type Stage = "selector" | "loading" | "pix" | "boleto" | "success";

interface PixData { pixQrCodeUrl: string; pixCopiaECola: string; vencimento: string }
interface BoletoData { bankSlipUrl: string; vencimento: string }

export default function PagamentoPage() {
  const router = useRouter();
  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [stage, setStage] = useState<Stage>("selector");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling de status a cada 5s enquanto aguarda PIX/Boleto
  useEffect(() => {
    if (stage !== "pix" && stage !== "boleto") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/subscription/status");
        const data = await res.json();
        if (data?.data?.statusAssinatura === "ativo") {
          clearInterval(pollRef.current!);
          setStage("success");
          setTimeout(() => router.push("/dashboard"), 2500);
        }
      } catch {}
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [stage, router]);

  async function handleAssinar() {
    setStage("loading");
    setError("");

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingType }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao gerar cobrança.");
        setStage("selector");
        return;
      }

      const data = json.data;

      if (data.tipo === "cartao") {
        window.location.href = data.invoiceUrl;
        return;
      }

      if (data.tipo === "pix") {
        setPixData({ pixQrCodeUrl: data.pixQrCodeUrl, pixCopiaECola: data.pixCopiaECola, vencimento: data.vencimento });
        setStage("pix");
        return;
      }

      if (data.tipo === "boleto") {
        setBoletoData({ bankSlipUrl: data.bankSlipUrl, vencimento: data.vencimento });
        setStage("boleto");
        return;
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStage("selector");
    }
  }

  async function handleCopy() {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Tela de sucesso ─────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Pagamento confirmado!</h1>
          <p className="text-sm text-slate-500">Redirecionando para o dashboard...</p>
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
        </div>
      </div>
    );
  }

  // ── Tela PIX ────────────────────────────────────────────────
  if (stage === "pix" && pixData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Pague com PIX</h1>
            <p className="text-sm text-slate-500">Escaneie o QR code ou copie a chave PIX</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            {/* Valor */}
            <div className="text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">R$ 120,00</span>
              <p className="text-xs text-slate-400 mt-1">Vence em {pixData.vencimento}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pixData.pixQrCodeUrl}
                  alt="QR Code PIX"
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>

            {/* Copia-e-cola */}
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border text-sm font-semibold transition-all ${
                copied
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Chave copiada!" : "Copiar chave PIX"}
            </button>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Aguardando confirmação do pagamento...
            </div>
          </div>

          <button
            onClick={() => setStage("selector")}
            className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Voltar e escolher outra forma de pagamento
          </button>
        </div>
      </div>
    );
  }

  // ── Tela Boleto ─────────────────────────────────────────────
  if (stage === "boleto" && boletoData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Boleto gerado</h1>
            <p className="text-sm text-slate-500">Pague em qualquer banco, lotérica ou app</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">R$ 120,00</span>
              <p className="text-xs text-slate-400 mt-1">Vence em {boletoData.vencimento}</p>
            </div>

            <a
              href={boletoData.bankSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir boleto (PDF)
            </a>

            <p className="text-xs text-center text-slate-400 leading-relaxed">
              Após o pagamento, a confirmação pode levar até 2 dias úteis.
              Esta página detecta o pagamento automaticamente.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Aguardando confirmação...
            </div>
          </div>

          <button
            onClick={() => setStage("selector")}
            className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Voltar e escolher outra forma de pagamento
          </button>
        </div>
      </div>
    );
  }

  // ── Tela seletor (default) ──────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-5">

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

        <div className="rounded-2xl border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10 p-6 space-y-5">

          {/* Preço */}
          <div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Plano Clínica</p>
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

          {/* Seletor de pagamento */}
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
            {billingType === "CREDIT_CARD" && (
              <p className="text-[11px] text-slate-400 text-center">
                Você será redirecionado para a página segura do Asaas.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

          <button
            onClick={handleAssinar}
            disabled={stage === "loading"}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
          >
            {stage === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando cobrança...</>
            ) : (
              "Assinar agora — R$ 120/mês"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
