export default function AgendaLoading() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-[520px]" />
      <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-[520px]" />
    </div>
  );
}
