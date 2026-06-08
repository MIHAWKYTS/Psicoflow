"use client";

import { useState, useEffect } from "react";
import { Plus, UserPlus, Shield, Mail, ShieldCheck, Lock, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

type TeamUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: string;
};

const inputClass =
  "w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

const ROLE_LABELS: Record<string, string> = {
  psicologo_admin: "Admin",
  psicologo: "Psicólogo",
  secretaria: "Secretária",
};

const ROLE_STYLES: Record<string, string> = {
  psicologo_admin: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
  psicologo: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30",
  secretaria: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
};

export default function EquipePage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    } catch {
      console.error("Erro ao buscar equipe");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: formNome, email: formEmail, senha: formSenha, role: formRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao criar usuário");
      } else {
        setSuccessMsg("Membro da equipe criado com sucesso!");
        setFormNome(""); setFormEmail(""); setFormSenha(""); setFormRole("secretaria");
        fetchUsers();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Erro de comunicação com o servidor.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleAtivo(user: TeamUser) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !user.ativo }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, ativo: !u.ativo } : u))
        );
      } else {
        alert(data.error || "Erro ao alterar status.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setTogglingId(null);
    }
  }

  const members = users.filter((u) => u.role !== "psicologo_admin");
  const admins = users.filter((u) => u.role === "psicologo_admin");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-500" />
          Gestão de Equipe e Acessos
        </h1>
        <p className="text-xs text-slate-450 dark:text-slate-500">
          Gerencie o acesso de secretárias e psicólogos à sua clínica. Membros desativados perdem acesso imediatamente no próximo login.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-fit">
          <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-500" />
            Novo Membro
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome Completo</label>
              <input type="text" required value={formNome} onChange={(e) => setFormNome(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-mail (Login)</label>
              <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Senha Provisória</label>
              <input type="password" required minLength={6} value={formSenha} onChange={(e) => setFormSenha(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nível de Acesso</label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className={inputClass}>
                <option value="secretaria">Secretária — Acesso Restrito</option>
                <option value="psicologo">Psicólogo — Acesso Clínico</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isCreating ? "Criando..." : "Cadastrar Usuário"}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2 space-y-5">

          {/* Admin */}
          {admins.length > 0 && (
            <div>
              <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1 mb-2">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                Administrador
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {admins.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base">
                        {user.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{user.nome}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />{user.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${ROLE_STYLES.psicologo_admin}`}>
                      {ROLE_LABELS.psicologo_admin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipe */}
          <div>
            <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1 mb-2">
              <Shield className="w-3.5 h-3.5 text-sky-500" />
              Membros da Equipe
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">Carregando equipe...</div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Nenhum membro cadastrado ainda. Adicione uma secretária ou psicólogo.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {members.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                        !user.ativo ? "opacity-60 bg-slate-50/60 dark:bg-slate-950/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                          user.role === "psicologo"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {user.nome}
                            {!user.ativo && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Inativo
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />{user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${ROLE_STYLES[user.role] ?? ""}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                          {user.role === "secretaria" && <Lock className="w-2.5 h-2.5 inline-block ml-1" />}
                        </span>

                        <button
                          onClick={() => handleToggleAtivo(user)}
                          disabled={togglingId === user.id}
                          title={user.ativo ? "Desativar acesso" : "Reativar acesso"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 cursor-pointer"
                          style={user.ativo
                            ? { borderColor: "rgb(254 202 202)", color: "rgb(220 38 38)", background: "rgb(254 242 242)" }
                            : { borderColor: "rgb(167 243 208)", color: "rgb(5 150 105)", background: "rgb(236 253 245)" }
                          }
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.ativo ? (
                            <ToggleRight className="w-3.5 h-3.5" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                          {user.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nota de segurança */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>Importante:</strong> Membros desativados não conseguem fazer login. Se a assinatura da clínica for suspensa por inadimplência, <strong>todos os membros</strong> perdem acesso automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}
