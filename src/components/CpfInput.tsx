"use client";

import { useState } from "react";
import { validateCPF } from "@/lib/validations";

type CpfInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function CpfInput({
  value,
  onChange,
  error,
  disabled,
  placeholder = "000.000.000-00",
  className = "",
}: CpfInputProps) {
  const [blurError, setBlurError] = useState<string | null>(null);

  const displayValue = applyMask(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    onChange(digits);
    setBlurError(null);
  }

  function handleBlur() {
    if (value && !validateCPF(value)) {
      setBlurError("CPF inválido");
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
