import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import FinanceiroDashboard from "@/components/dashboard/FinanceiroDashboard";
import FinanceiroForm from "@/components/dashboard/FinanceiroForm";

export default async function FinanceiroPage() {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");

  const canViewData = ctx.role === "psicologo_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Financeiro
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {canViewData
            ? "Controle de receitas, despesas e fluxo de caixa"
            : "Registre receitas e despesas do consultório"}
        </p>
      </div>

      {canViewData ? <FinanceiroDashboard /> : <FinanceiroForm />}
    </div>
  );
}
