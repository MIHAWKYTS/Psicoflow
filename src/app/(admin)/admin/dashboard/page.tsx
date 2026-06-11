"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Brain } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type Tenant = {
  id: string;
  nomeClinica: string;
  statusAssinatura: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; patients: number };
};

type TenantUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

type TenantDetail = {
  id: string;
  nomeClinica: string;
  documento: string;
  statusAssinatura: string;
  isActive: boolean;
  createdAt: string;
  _count: { patients: number };
  users: TenantUser[];
};

// ─── Constants ───────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ativo:        { label: "Ativo",        className: "bg-emerald-900/40 text-emerald-400 border-emerald-800" },
  trial:        { label: "Trial",        className: "bg-blue-900/40 text-blue-400 border-blue-800" },
  inadimplente: { label: "Inadimplente", className: "bg-red-900/40 text-red-400 border-red-800" },
  cancelado:    { label: "Cancelado",    className: "bg-slate-700 text-slate-400 border-slate-600" },
};

const ROLE_LABELS: Record<string, string> = {
  psicologo_admin: "Administrador",
  psicologo:       "Psicólogo",
  secretaria:      "Secretária",
};

const ROLE_ORDER = ["psicologo_admin", "psicologo", "secretaria"];

// ─── Component ───────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();

  // Lista
  const [tenants, setTenants]         = useState<Tenant[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [erro, setErro]               = useState("");
  const [erroToggle, setErroToggle]   = useState<string | null>(null);

  // Drawer
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [tenantDetail, setTenantDetail]     = useState<TenantDetail | null>(null);
  const [loadingDetail, setLoadingDetail]   = useState(false);

  // ── Carregar lista ──
  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.success) setTenants(data.data);
        else if (data) setErro("Não foi possível carregar os tenants.");
      })
      .catch(() => setErro("Erro de conexão."))
      .finally(() => setCarregando(false));
  }, [router]);

  // ── ESC fecha drawer ──
  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  // ── Drawer ──
  function openDrawer(id: string) {
    setSelectedId(id);
    setTenantDetail(null);
    setLoadingDetail(true);
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTenantDetail(d.data); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }

  function closeDrawer() {
    setSelectedId(null);
    setTenantDetail(null);
  }

  // ── Toggle isActive ──
  async function toggleIsActive(e: React.MouseEvent, tenant: Tenant) {
    e.stopPropagation();
    const novoValor = !tenant.isActive;
    setErroToggle(null);
    setTenants((prev) => prev.map((t) => t.id === tenant.id ? { ...t, isActive: novoValor } : t));
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: novoValor }),
      });
      if (!res.ok) {
        setTenants((prev) => prev.map((t) => t.id === tenant.id ? { ...t, isActive: tenant.isActive } : t));
        setErroToggle(`Erro ao atualizar "${tenant.nomeClinica}".`);
      }
    } catch {
      setTenants((prev) => prev.map((t) => t.id === tenant.id ? { ...t, isActive: tenant.isActive } : t));
      setErroToggle(`Erro de conexão ao atualizar "${tenant.nomeClinica}".`);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const total   = tenants.length;
  const ativos  = tenants.filter((t) => t.isActive).length;
  const inativos = total - ativos;

  // Usuários agrupados por role
  const usersByRole = tenantDetail
    ? ROLE_ORDER.reduce<Record<string, TenantUser[]>>((acc, role) => {
        const grupo = tenantDetail.users.filter((u) => u.role === role);
        if (grupo.length) acc[role] = grupo;
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold">
            <Brain className="w-5 h-5 text-violet-400" />
            Psi<span className="text-violet-400">Gen</span>
            <span className="ml-1 text-xs font-normal text-slate-400">Admin</span>
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
            { label: "Contas Ativas",     value: ativos },
            { label: "Contas Inativas",   value: inativos },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
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
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Carregando...</td></tr>
              )}
              {!carregando && erro && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-red-400">{erro}</td></tr>
              )}
              {!carregando && !erro && tenants.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum tenant encontrado.</td></tr>
              )}
              {tenants.map((t) => {
                const badge = STATUS_BADGE[t.statusAssinatura] ?? STATUS_BADGE["cancelado"];
                const isSelected = selectedId === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => openDrawer(t.id)}
                    className={`cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors ${
                      isSelected ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{t.nomeClinica}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
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
                        onClick={(e) => toggleIsActive(e, t)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          t.isActive ? "bg-violet-600" : "bg-slate-700"
                        }`}
                        title={t.isActive ? "Desativar conta" : "Ativar conta"}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          t.isActive ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Drawer overlay ── */}
      {selectedId && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDrawer}
          />

          {/* Painel */}
          <aside className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
              <div className="flex-1 min-w-0">
                {loadingDetail ? (
                  <div className="h-5 w-40 rounded bg-slate-800 animate-pulse" />
                ) : (
                  <h2 className="font-bold text-white text-base truncate">
                    {tenantDetail?.nomeClinica ?? "—"}
                  </h2>
                )}
                {tenantDetail && (
                  <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                    (STATUS_BADGE[tenantDetail.statusAssinatura] ?? STATUS_BADGE["cancelado"]).className
                  }`}>
                    {(STATUS_BADGE[tenantDetail.statusAssinatura] ?? STATUS_BADGE["cancelado"]).label}
                  </span>
                )}
              </div>
              <button
                onClick={closeDrawer}
                className="ml-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 px-6 py-5 space-y-6">

              {/* Dados cadastrais */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Dados da clínica
                </h3>
                {loadingDetail ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                    ))}
                  </div>
                ) : tenantDetail ? (
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Documento</dt>
                      <dd className="text-slate-200 font-medium">{tenantDetail.documento || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Cadastro</dt>
                      <dd className="text-slate-200 font-medium">
                        {new Date(tenantDetail.createdAt).toLocaleDateString("pt-BR")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Pacientes</dt>
                      <dd className="text-slate-200 font-medium">{tenantDetail._count.patients}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Conta</dt>
                      <dd className={`font-medium ${tenantDetail.isActive ? "text-emerald-400" : "text-red-400"}`}>
                        {tenantDetail.isActive ? "Ativa" : "Inativa"}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </section>

              {/* Equipe */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Equipe
                </h3>
                {loadingDetail ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded-lg bg-slate-800 animate-pulse" />
                    ))}
                  </div>
                ) : tenantDetail && Object.keys(usersByRole).length > 0 ? (
                  <div className="space-y-4">
                    {ROLE_ORDER.filter((r) => usersByRole[r]).map((role) => (
                      <div key={role}>
                        <p className="text-xs font-semibold text-slate-500 mb-2">
                          {ROLE_LABELS[role]} ({usersByRole[role].length})
                        </p>
                        <ul className="space-y-1.5">
                          {usersByRole[role].map((u) => (
                            <li
                              key={u.id}
                              className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{u.nome}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                              </div>
                              <span className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                u.ativo
                                  ? "bg-emerald-900/40 text-emerald-400 border-emerald-800"
                                  : "bg-slate-700 text-slate-400 border-slate-600"
                              }`}>
                                {u.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : tenantDetail ? (
                  <p className="text-sm text-slate-500">Nenhum usuário encontrado.</p>
                ) : null}
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
