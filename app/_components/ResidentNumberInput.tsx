"use client";

import { useState } from "react";
import { formatResidentNumber as formatResidentNumberDisplay } from "@/app/lib/formatters";

const themeRing = {
  emerald: "focus:border-emerald-500 focus:ring-emerald-500",
  blue: "focus:border-blue-500 focus:ring-blue-500",
} as const;

type ResidentNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  theme?: "emerald" | "blue";
  required?: boolean;
};

export function formatResidentNumber(value: string) {
  return formatResidentNumberDisplay(value, { maxDigits: 13 });
}

export function validateResidentNumber(
  value: string,
  options?: { required?: boolean },
): string | null {
  if (!value.trim()) {
    return options?.required ? "주민등록번호를 입력해주세요." : null;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) {
    return "주민등록번호는 13자리여야 합니다.";
  }
  return null;
}

export default function ResidentNumberInput({
  value,
  onChange,
  disabled = false,
  id,
  theme = "emerald",
  required = false,
}: ResidentNumberInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validateResidentNumber(value, { required }) : null;

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatResidentNumber(e.target.value))}
        onBlur={() => setTouched(true)}
        placeholder="000000-0000000"
        maxLength={14}
        required={required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : `border-gray-200 ${themeRing[theme]}`
        }`}
        disabled={disabled}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
