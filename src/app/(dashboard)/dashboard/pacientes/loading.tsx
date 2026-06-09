export default function PacientesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-32" />
        ))}
      </div>
    </div>
  );
}
