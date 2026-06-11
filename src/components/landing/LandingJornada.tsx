import { Clock, HeartHandshake, CheckCheck } from "lucide-react";

const etapas = [
  {
    icon: Clock,
    tag: "Antes da sessão",
    title: "Prepare-se sem estresse",
    items: [
      "Agenda organizada por semana ou mês",
      "Lembrete automático via WhatsApp para o paciente",
      "Consulte o prontuário e histórico em segundos",
      "Visualize as sessões do dia ao abrir o sistema",
    ],
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-100 dark:border-indigo-900/40",
  },
  {
    icon: HeartHandshake,
    tag: "Durante a sessão",
    title: "Foco total no paciente",
    items: [
      "Registro de evolução clínica rápido e estruturado",
      "Anotações de anamnese e hipóteses diagnósticas",
      "Plano de trabalho acessível a qualquer momento",
      "Sem papelada, sem distrações",
    ],
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900/40",
  },
  {
    icon: CheckCheck,
    tag: "Após a sessão",
    title: "Feche tudo com um clique",
    items: [
      "Registre o pagamento ou marque como pendente",
      "Envie materiais e tarefas pelo WhatsApp",
      "Agende a próxima sessão direto no sistema",
      "Relatório financeiro do mês sempre atualizado",
    ],
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
];

export default function LandingJornada() {
  return (
    <section id="jornada" className="py-24 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Do início ao fim da sessão,{" "}
            <span className="text-indigo-600 dark:text-indigo-400">sem atrito</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Você se formou para cuidar de pessoas, não para preencher formulários.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {etapas.map((e, i) => {
            const Icon = e.icon;
            return (
              <div
                key={e.tag}
                className={`relative p-7 rounded-2xl bg-white dark:bg-slate-900 border ${e.border} shadow-sm`}
              >
                <div className="absolute -top-3 left-6">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${e.bg} ${e.color} border ${e.border}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={`inline-flex p-3 rounded-xl ${e.bg} mb-5 mt-2`}>
                  <Icon className={`w-5 h-5 ${e.color}`} />
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest ${e.color} mb-1`}>{e.tag}</p>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">{e.title}</h3>
                <ul className="space-y-2.5">
                  {e.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${e.color.replace("text-", "bg-")}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
