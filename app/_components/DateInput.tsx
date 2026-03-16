"use client";

import { useState } from "react";

const themeRing = {
  emerald: "focus:border-emerald-500 focus:ring-emerald-500",
  blue: "focus:border-blue-500 focus:ring-blue-500",
} as const;

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  theme?: "emerald" | "blue";
  placeholder?: string;
};

export function formatDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function validateDate(value: string): string | null {
  if (!value.trim()) return null;

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) {
    return "날짜를 YYYY-MM-DD 형식으로 입력해주세요.";
  }

  const year = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day = parseInt(digits.slice(6, 8), 10);

  if (year < 1900 || year > 2100) {
    return "올바른 연도를 입력해주세요.";
  }

  if (month < 1 || month > 12) {
    return "올바른 월을 입력해주세요.";
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return "올바른 일을 입력해주세요.";
  }

  return null;
}

export default function DateInput({
  value,
  onChange,
  disabled = false,
  id,
  theme = "emerald",
  placeholder = "YYYY-MM-DD",
}: DateInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validateDate(value) : null;

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatDate(e.target.value))}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        maxLength={10}
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
