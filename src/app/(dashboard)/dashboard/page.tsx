import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export const metadata = {
  title: "Visão Geral — PsiGen",
  description: "Estatísticas da clínica e faturamento",
};

export default async function DashboardPage() {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");
  return <DashboardOverview role={ctx.role} />;
}
