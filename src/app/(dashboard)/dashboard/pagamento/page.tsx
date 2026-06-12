import { redirect } from "next/navigation";
import { use } from "react";
import { CheckCircle2, AlertTriangle, Clock, XCircle, ExternalLink, Sparkles } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import CheckoutButtons from "./_CheckoutButtons";

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

export default async function PagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const isPending = params.status === "pending";

  const status = user.statusAssinatura;
  const dataFimTrial = user.dataFimTrial ? new Date(user.dataFimTrial) : null;
  const now = new Date();
  const trialExpired = status === "trial" && dataFimTrial && dataFimTrial < now;
  const daysLeft = dataFimTrial && !trialExpired
    ? Math.max(0, Math.ceil((dataFimTrial.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-5">

        {/* Aviso de pagamento pendente */}
        {isPending && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Aguardando confirmação do pagamento
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Pode levar alguns instantes. Esta página atualiza automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Card de status */}
        {status === "ativo" ? (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Assinatura ativa</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Acesso completo ao PsiGen</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sua assinatura está em dia. Para gerenciar faturas, acesse o portal de cobranças do Asaas.
            </p>
            <a
              href="https://www.asaas.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver faturas no Asaas
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10 p-6 space-y-5">

            {/* Status header */}
            <div>
              {status === "trial" && !trialExpired && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {daysLeft > 0 ? `${daysLeft} dias de trial restantes` : "Último dia de trial"}
                  </div>
                </div>
              )}
              {(status === "trial" && trialExpired) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Período de teste encerrado — assine para continuar
                  </p>
                </div>
              )}
              {status === "inadimplente" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mb-3">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Assinatura vencida — regularize para retomar o acesso
                  </p>
                </div>
              )}

              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                Plano Clínica
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-400">R$</span>
                <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">150</span>
                <span className="text-base font-semibold text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Cancele quando quiser. Sem fidelidade.</p>
            </div>

            {/* Features */}
            <ul className="space-y-1.5">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Botões de checkout */}
            <CheckoutButtons
              label={status === "inadimplente" ? "Regularizar" : "Assinar"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
