import {
  CalendarDays,
  FileText,
  DollarSign,
  MessageSquare,
  Users,
  Package,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    description: "Gerencie sessões, horários e confirmações com visualização semanal e mensal.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  {
    icon: FileText,
    title: "Prontuário Clínico",
    description: "Anamnese, evolução clínica, hipóteses diagnósticas e contratos terapêuticos em segurança total.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: DollarSign,
    title: "Gestão Financeira",
    description: "Controle receitas, despesas e recebíveis. Veja o faturamento da clínica em tempo real.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    description: "Envie lembretes de sessão e materiais diretamente pelo WhatsApp, sem sair do sistema.",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  {
    icon: Users,
    title: "Gestão de Equipe",
    description: "Adicione psicólogos e secretárias com permissões específicas para cada função.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: Package,
    title: "Controle de Estoque",
    description: "Gerencie materiais e suprimentos da clínica com histórico de movimentações.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Tudo para sua clínica em um só lugar
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Do agendamento ao prontuário, do financeiro ao WhatsApp — sem precisar de múltiplos sistemas.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
