"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
];

export default function RotinaPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    try {
      setLoading(true);
      const query = statusFilter !== "todos" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/tasks${query}`);
      const data = await res.json();
      setTasks(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const groupedTasks = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, item) => {
      acc[item.value] = tasks.filter((task) => task.status === item.value);
      return acc;
    }, {} as Record<string, any[]>);
  }, [tasks]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao }),
    });

    if (res.ok) {
      setTitulo("");
      setDescricao("");
      fetchTasks();
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: task.titulo,
        descricao: task.descricao || "",
        status,
        patientId: task.patientId || undefined,
        dataVencimento: task.dataVencimento || undefined,
      }),
    });

    fetchTasks();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Rotina e Tarefas
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Gerencie tarefas do dia a dia com status e progresso.
        </p>
      </div>

      <form
        onSubmit={handleCreateTask}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da tarefa"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm"
          required
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-sm"
        />
        <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold">
          Criar tarefa
        </button>
      </form>

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-500">Filtrar status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
        >
          <option value="todos">Todos</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Carregando tarefas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_OPTIONS.map((column) => (
            <div
              key={column.value}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4"
            >
              <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3">
                {column.label}
              </h2>
              <div className="space-y-2">
                {(groupedTasks[column.value] || []).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20"
                  >
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                      {task.titulo}
                    </p>
                    {task.descricao ? (
                      <p className="text-xs text-slate-500 mt-1">{task.descricao}</p>
                    ) : null}
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {groupedTasks[column.value]?.length === 0 ? (
                  <p className="text-xs text-slate-400">Sem tarefas.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
