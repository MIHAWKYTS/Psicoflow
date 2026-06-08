import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import ProntuariosList from "@/components/dashboard/ProntuariosList";

export default async function ProntuariosPage() {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Prontuários
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Acesse e edite o prontuário clínico de cada paciente
        </p>
      </div>
      <ProntuariosList />
    </div>
  );
}
