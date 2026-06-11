import Link from "next/link";
import { ArrowRight, MessageCircle, CheckCircle2 } from "lucide-react";

export default function LandingHero() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=Olá! Tenho interesse no PsiGen.`
    : "https://wa.me/";

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-indigo-100/50 dark:bg-indigo-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-violet-100/40 dark:bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          15 dias grátis · Sem cartão de crédito
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto">
          Sua clínica{" "}
          <span className="text-indigo-600 dark:text-indigo-400">organizada.</span>
          <br />
          Seus pacientes{" "}
          <span className="text-violet-600 dark:text-violet-400">cuidados.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Tudo que você precisa para gerir sua clínica de psicologia em um único lugar —
          agenda, prontuários, financeiro, WhatsApp e muito mais.
        </p>

        {/* Social proof bullets */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          {["Agenda inteligente", "Prontuário digital seguro", "WhatsApp integrado", "Multi-profissionais"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {item}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/registro"
            className="group flex items-center gap-2 px-7 py-3.5 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            Começar 15 dias grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            Falar com a equipe
          </a>
        </div>

        <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
          Cancele quando quiser · Suporte incluso · Dados 100% seguros (LGPD)
        </p>
      </div>
    </section>
  );
}
