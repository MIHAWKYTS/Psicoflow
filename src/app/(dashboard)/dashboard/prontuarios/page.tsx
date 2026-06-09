import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import ProntuariosList from "@/components/dashboard/ProntuariosList";

export default async function ProntuariosPage() {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
            Prontuários Clínicos
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Acesse e edite o prontuário clínico de cada paciente ativo
          </p>
        </div>
      </div>
      <ProntuariosList />
    </div>
  );
}
