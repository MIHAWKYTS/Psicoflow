import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const inclusos = [
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
  "Atualizações incluídas",
  "Backup automático dos dados",
];

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
            Preços
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Simples. Tudo incluído.
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Um único plano com tudo que sua clínica precisa. Sem surpresas na fatura.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div className="relative rounded-3xl border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 p-8 overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Mais popular
              </div>
            </div>

            {/* Plan name */}
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
              Plano Clínica
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">R$</span>
              <span className="text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">100</span>
              <span className="text-lg font-semibold text-slate-400">/mês</span>
            </div>

            {/* Trial badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-7">
              <Check className="w-4 h-4" />
              15 dias grátis · Sem cartão de crédito
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {inclusos.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/registro"
              className="block w-full py-4 text-center text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Começar 15 dias grátis
            </Link>

            <p className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
