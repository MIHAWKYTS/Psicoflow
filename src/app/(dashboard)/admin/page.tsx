"use client";

import { useEffect, useState } from "react";
import { BarChart, Users, Building, DollarSign, Activity, Settings, TrendingUp } from "lucide-react";

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.data);
        }
      } catch (err) {
        console.error("Erro ao buscar dados admin", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-medium">Carregando painel de administração...</div>;
  }

  if (!metrics) {
    return <div className="p-10 text-center text-rose-500 font-medium">Acesso Negado ou Erro ao carregar dados.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          Painel Super Admin
        </h1>
        <p className="text-sm text-slate-500">Visão global da plataforma Psicoflow, clientes e faturamento.</p>
      </div>

      {/* Cards de Métricas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                <Building className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Clínicas/Tenants</h3>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-sky-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+8%</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Psicólogos</h3>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Activity className="w-5 h-5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pacientes Ativos</h3>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">+15.3%</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Faturamento Transacionado</h3>
              <p className="text-3xl font-extrabold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.faturamentoTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas de Clínicas Recentes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Clínicas Recentes (Tenants)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 pl-6">Clínica / Nome</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4">Membros</th>
                <th className="p-4 pr-6">Pacientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {metrics.clinicasResumo.map((clinica: any) => (
                <tr key={clinica.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{clinica.nome}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{clinica.id}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {clinica.plano}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border tracking-wider ${
                      clinica.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      clinica.status === 'trial' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {clinica.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {clinica.qtdUsuarios}
                  </td>
                  <td className="p-4 pr-6 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {clinica.qtdPacientes}
                  </td>
                </tr>
              ))}
              {metrics.clinicasResumo.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                    Nenhuma clínica cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
