"use client";

import { useState } from "react";

const themeRing = {
  emerald: "focus:border-emerald-500 focus:ring-emerald-500",
  blue: "focus:border-blue-500 focus:ring-blue-500",
} as const;

type EmailInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  theme?: "emerald" | "blue";
  placeholder?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return null;
  if (!EMAIL_REGEX.test(value.trim())) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  return null;
}

export default function EmailInput({
  value,
  onChange,
  disabled = false,
  id,
  theme = "emerald",
  placeholder = "user@example.com",
}: EmailInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validateEmail(value) : null;

  return (
    <div>
      <input
        id={id}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
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
