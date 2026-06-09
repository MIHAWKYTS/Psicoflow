export default function CasosLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-20" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-20" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-28" />
      ))}
    </div>
  );
}
