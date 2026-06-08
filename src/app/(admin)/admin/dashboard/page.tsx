"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tenant = {
  id: string;
  nomeClinica: string;
  statusAssinatura: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; patients: number };
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-emerald-900/40 text-emerald-400 border-emerald-800" },
  trial: { label: "Trial", className: "bg-blue-900/40 text-blue-400 border-blue-800" },
  inadimplente: { label: "Inadimplente", className: "bg-red-900/40 text-red-400 border-red-800" },
  cancelado: { label: "Cancelado", className: "bg-slate-700 text-slate-400 border-slate-600" },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroToggle, setErroToggle] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.success) setTenants(data.data);
        else if (data) setErro("Não foi possível carregar os tenants.");
      })
      .catch(() => setErro("Erro de conexão."))
      .finally(() => setCarregando(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function toggleIsActive(tenant: Tenant) {
    const novoValor = !tenant.isActive;
    setErroToggle(null);

    // Atualização otimista
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, isActive: novoValor } : t))
    );

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: novoValor }),
      });

      if (!res.ok) {
        // Reverte em caso de erro
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, isActive: tenant.isActive } : t))
        );
        setErroToggle(`Erro ao atualizar "${tenant.nomeClinica}".`);
      }
    } catch {
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, isActive: tenant.isActive } : t))
      );
      setErroToggle(`Erro de conexão ao atualizar "${tenant.nomeClinica}".`);
    }
  }

  const total = tenants.length;
  const ativos = tenants.filter((t) => t.isActive).length;
  const inativos = total - ativos;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-lg font-bold">
            Psico<span className="text-violet-400">Flow</span>
            <span className="ml-2 text-xs font-normal text-slate-400">Admin</span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Métricas */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: "Total de Clínicas", value: total },
            { label: "Contas Ativas", value: ativos },
            { label: "Contas Inativas", value: inativos },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
            >
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {erroToggle && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {erroToggle}
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Mensalidade</th>
                <th className="px-4 py-3 font-medium">Usuários</th>
                <th className="px-4 py-3 font-medium">Pacientes</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 font-medium">Conta</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!carregando && erro && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-400">
                    {erro}
                  </td>
                </tr>
              )}
              {!carregando && !erro && tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              )}
              {tenants.map((t) => {
                const badge = STATUS_BADGE[t.statusAssinatura] ?? STATUS_BADGE["cancelado"];
                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium">{t.nomeClinica}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t._count.users}</td>
                    <td className="px-4 py-3 text-slate-300">{t._count.patients}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleIsActive(t)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          t.isActive ? "bg-violet-600" : "bg-slate-700"
                        }`}
                        title={t.isActive ? "Desativar conta" : "Ativar conta"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            t.isActive ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
