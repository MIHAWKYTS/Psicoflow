"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Verificar se há preferência salva ou se o sistema está em dark mode
    const savedTheme = localStorage.getItem("psicoflow_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark) ? "dark" : "light";
    setTheme(initialTheme);
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("psicoflow_theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-sm hover:shadow active:scale-95 group focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      aria-label="Alternar tema"
    >
      <div className="relative w-5 h-5 overflow-hidden flex items-center justify-center">
        {/* Ícone de Sol */}
        <div
          className={`absolute transform transition-all duration-500 ease-out ${
            theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <Sun className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-none" />
        </div>
        
        {/* Ícone de Lua */}
        <div
          className={`absolute transform transition-all duration-500 ease-out ${
            theme === "light" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <Moon className="w-5 h-5 text-sky-400 fill-sky-950/20 dark:fill-sky-400/20" />
        </div>
      </div>
    </button>
  );
}
