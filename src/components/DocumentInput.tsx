"use client";

import { useState } from "react";
import { validateDocument } from "@/lib/validations";

type DocumentInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

function applyMask(digits: string): string {
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function DocumentInput({
  value,
  onChange,
  error,
  disabled,
  className = "",
}: DocumentInputProps) {
  const [blurError, setBlurError] = useState<string | null>(null);

  const digits = value.replace(/\D/g, "").slice(0, 14);
  const displayValue = applyMask(digits);
  const placeholder = digits.length > 11 ? "00.000.000/0000-00" : "000.000.000-00";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
    onChange(raw);
    setBlurError(null);
  }

  function handleBlur() {
    if (digits && !validateDocument(digits)) {
      setBlurError(digits.length <= 11 ? "CPF inválido" : "CNPJ inválido");
    } else {
      setBlurError(null);
    }
  }

  const visibleError = error ?? blurError;

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
      {visibleError && (
        <p className="mt-1 text-xs text-rose-500">{visibleError}</p>
      )}
    </div>
  );
}
