"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "O que acontece nos 15 dias grátis?",
    a: "Você tem acesso completo a todas as funcionalidades do plano sem nenhuma cobrança. Não pedimos cartão de crédito para começar. Ao final dos 15 dias, você escolhe se deseja assinar ou não.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem burocracia. Cancele a qualquer momento pelo sistema. Não há multa, fidelidade ou prazo mínimo. Seus dados ficam disponíveis por 30 dias após o cancelamento.",
  },
  {
    q: "Meus dados e dos pacientes estão seguros?",
    a: "Sim. O PsiGen segue as diretrizes da LGPD. Os dados são armazenados de forma criptografada, com backup automático. Somente usuários autorizados da sua clínica têm acesso às informações.",
  },
  {
    q: "Quantos profissionais posso cadastrar?",
    a: "O plano inclui usuários ilimitados para sua clínica — você pode ter administradores, psicólogos e secretárias, cada um com permissões adequadas ao seu papel.",
  },
  {
    q: "Tenho suporte se precisar de ajuda?",
    a: "Sim. O suporte está incluso no plano e é feito via WhatsApp. Nossa equipe responde em horário comercial para te ajudar com qualquer dúvida.",
  },
  {
    q: "Posso migrar meus dados de outro sistema?",
    a: "Oferecemos suporte para importação de dados de pacientes. Entre em contato com nossa equipe pelo WhatsApp antes de assinar e vamos ajudar no processo de migração.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. O sistema é responsivo e funciona bem em smartphones e tablets, sem precisar instalar nenhum aplicativo. Acesse pelo navegador de qualquer dispositivo.",
  },
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Dúvidas frequentes
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
