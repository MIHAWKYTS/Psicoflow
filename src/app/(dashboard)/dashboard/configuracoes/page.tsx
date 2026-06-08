import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import WhatsAppConfig from "@/components/dashboard/WhatsAppConfig";
import { Settings } from "lucide-react";

export default async function ConfiguracoesPage() {
  const ctx = await getRequestContext();

  if (!ctx) redirect("/login");
  if (ctx.role !== "psicologo_admin") redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            Configurações
          </h1>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Gerencie as integrações e preferências da sua clínica
        </p>
      </div>

      <WhatsAppConfig />
    </div>
  );
}
