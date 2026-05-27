"use client";

import { useState, useEffect } from "react";
import { Plus, UserPlus, Shield, Mail, Trash2, ShieldCheck, Lock } from "lucide-react";

export default function EquipePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSenha, setFormSenha] = useState("");
  const [formRole, setFormRole] = useState("secretaria");

  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar equipe", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formNome,
          email: formEmail,
          senha: formSenha,
          role: formRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao criar usuário");
      } else {
        setSuccessMsg("Membro da equipe criado com sucesso!");
        setFormNome("");
        setFormEmail("");
        setFormSenha("");
        setFormRole("secretaria");
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg("Erro de comunicação com o servidor.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-500" />
          Gestão de Equipe e Acessos
        </h1>
        <p className="text-xs text-slate-450 dark:text-slate-500">
          Gerencie o acesso de secretárias e outros psicólogos à sua clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-fit">
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-500" />
            Novo Membro
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 text-xs bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <input
                type="text"
                required
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail (Login)</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha Provisória</label>
              <input
                type="password"
                required
                minLength={6}
                value={formSenha}
                onChange={(e) => setFormSenha(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível de Acesso (Role)</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
              >
                <option value="secretaria">Secretária (Acesso Restrito)</option>
                <option value="psicologo">Psicólogo (Acesso Total Clínico)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              {isCreating ? (
                "Criando..."
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Cadastrar Usuário
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Equipe */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-sky-500" />
            Usuários Ativos
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">Carregando equipe...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">Nenhum membro encontrado.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                        {user.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.nome}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100'
                          : user.role === 'psicologo'
                          ? 'bg-sky-50 text-sky-600 border-sky-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {user.role}
                        {user.role === 'secretaria' && <Lock className="w-2.5 h-2.5 inline-block ml-1" />}
                      </span>
                      
                      {/* Placeholder de exclusão */}
                      {user.role !== 'admin' && (
                        <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
