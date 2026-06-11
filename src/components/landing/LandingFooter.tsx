import Link from "next/link";
import { Brain } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
            <Brain className="w-5 h-5 text-indigo-600" />
            PsiGen
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#jornada" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Como funciona
            </a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Preços
            </a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              FAQ
            </a>
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Entrar
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
          © 2025 PsiGen. Todos os direitos reservados. · Dados protegidos conforme a LGPD.
        </div>
      </div>
    </footer>
  );
}
