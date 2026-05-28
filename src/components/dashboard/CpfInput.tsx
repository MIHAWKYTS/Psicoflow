"use client";

import { useState } from "react";
import { validateCPF } from "@/lib/validations";

// ===========================
// PsicoFlow — CpfInput
// Componente controlado com máscara ###.###.###-## e validação módulo 11.
// ===========================

interface CpfInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

/**
 * Aplica a máscara CPF: ###.###.###-##
 * Remove tudo que não é dígito antes de formatar.
 */
function applyCpfMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function CpfInput({
  value,
  onChange,
  className = "",
  placeholder = "000.000.000-00",
  required = false,
  id,
}: CpfInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Aplica máscara e propaga valor formatado
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCpfMask(e.target.value);
    onChange(masked);

    // Validação em tempo real só após o campo ter sido tocado
    if (touched) {
      const digits = masked.replace(/\D/g, "");
      if (digits.length === 0) {
        setError(null);
      } else if (digits.length < 11) {
        setError(null); // Ainda digitando
      } else {
        setError(validateCPF(masked) ? null : "CPF inválido");
      }
    }
  };

  // Valida ao perder foco
  const handleBlur = () => {
    setTouched(true);
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0 && !required) {
      setError(null);
      return;
    }
    if (digits.length === 0 && required) {
      setError("CPF é obrigatório");
      return;
    }
    if (digits.length < 11) {
      setError("CPF incompleto");
      return;
    }
    setError(validateCPF(value) ? null : "CPF inválido");
  };

  const baseClass = `w-full px-4 py-3 text-xs rounded-xl border font-semibold transition-all focus:outline-none focus:ring-2 placeholder:text-slate-400 ${
    error
      ? "border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/10 text-slate-700 dark:text-slate-200 focus:ring-rose-500/20 focus:border-rose-500"
      : "border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-sky-500/20 focus:border-sky-500"
  } ${className}`;

  return (
    <div className="space-y-1.5">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        maxLength={14} // "###.###.###-##" = 14 chars
        className={baseClass}
        autoComplete="off"
      />
      {error && touched && (
        <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
