export default function ProntuariosLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-20" />
      ))}
    </div>
  );
}
