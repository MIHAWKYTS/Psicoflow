
// Não usar "use client" aqui.

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "TROCAR_POR_UM_SEGREDO_FORTE_EM_PRODUCAO"
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Lê e valida o token JWT do cookie ────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("psicoflow_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userRole: "psicologo_admin" | "secretaria" = "psicologo_admin";
  let nomeClinica = "PsicoFlow";
  let statusAssinatura = "trial";
  let nomeUsuario = "";

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userRole = (payload.role as "psicologo_admin" | "secretaria") ?? "psicologo_admin";
    statusAssinatura = (payload.statusAssinatura as string) ?? "trial";
    nomeUsuario = (payload.email as string) ?? "";
    // nomeClinica poderia vir do banco se necessário — por ora usamos o padrão
  } catch {
    // Token inválido/expirado: redireciona para login
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950/60 overflow-hidden font-sans transition-all duration-300">
      {/* Sidebar do Menu */}
      <DashboardSidebar userRole={userRole} />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cabeçalho */}
        <DashboardHeader
          nomeClinica={nomeClinica}
          statusAssinatura={statusAssinatura}
        />

        {/* Corpo da página com scroll independente */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
