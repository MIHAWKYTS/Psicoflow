"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CheckCircle2, Clock, Circle, Loader2, ListTodo } from "lucide-react";

const STATUS_OPTIONS = [
  {
    value: "pendente",
    label: "Pendente",
    icon: Circle,
    accent: "border-t-slate-300 dark:border-t-slate-600",
    dotColor: "bg-slate-400",
    countBg: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  },
  {
    value: "em_andamento",
    label: "Em andamento",
    icon: Clock,
    accent: "border-t-amber-400",
    dotColor: "bg-amber-400",
    countBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  },
  {
    value: "concluida",
    label: "Concluída",
    icon: CheckCircle2,
    accent: "border-t-emerald-500",
    dotColor: "bg-emerald-500",
    countBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  },
];

export default function RotinaPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  const groupedTasks = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, item) => {
      acc[item.value] = tasks.filter((t) => t.status === item.value);
      return acc;
    }, {} as Record<string, any[]>);
  }, [tasks]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao }),
    });
    setSaving(false);
    if (res.ok) {
      setTitulo("");
      setDescricao("");
      fetchTasks();
    }
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: task.titulo,
        descricao: task.descricao || "",
        status: newStatus,
        patientId: task.patientId || undefined,
        dataVencimento: task.dataVencimento || undefined,
      }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
              Rotina e Tarefas
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Quadro Kanban para organizar atividades do dia a dia
            </p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <div key={s.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.countBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
              {groupedTasks[s.value]?.length ?? 0}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleCreateTask}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5"
      >
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Nova Tarefa
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da tarefa *"
            required
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={saving || !titulo.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-indigo-500/20 cursor-pointer shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar
          </button>
        </div>
      </form>

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_OPTIONS.map((s) => (
            <div key={s.value} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_OPTIONS.map((col) => {
            const colTasks = groupedTasks[col.value] || [];
            const Icon = col.icon;
            return (
              <div
                key={col.value}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 border-t-4 ${col.accent} shadow-sm flex flex-col`}
              >
                {/* Column header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${col.dotColor.replace("bg-", "text-")}`} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {col.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.countBg}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-3 space-y-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-8">
                      <p className="text-xs text-slate-300 dark:text-slate-600 text-center">
                        Nenhuma tarefa aqui
                      </p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all group"
                      >
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 leading-snug">
                          {task.titulo}
                        </p>
                        {task.descricao && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                            {task.descricao}
                          </p>
                        )}
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="mt-2.5 w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all uppercase tracking-wide"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
