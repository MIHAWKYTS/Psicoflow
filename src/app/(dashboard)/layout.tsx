import DashboardShell from "@/components/layout/DashboardShell";
import { getAuthUser } from "@/lib/auth";
import { featureFlags } from "@/lib/feature-flags";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userRole={user.role}
      userName={user.nome}
      statusAssinatura={user.statusAssinatura}
      dataFimTrial={user.dataFimTrial}
      features={{ estoque: featureFlags.estoque }}
    >
      {children}
    </DashboardShell>
  );
}
