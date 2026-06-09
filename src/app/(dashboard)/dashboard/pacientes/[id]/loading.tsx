export default function PacienteDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl w-24" />
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-64" />
    </div>
  );
}
