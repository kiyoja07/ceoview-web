"use client";

import { useState } from "react";
import { formatPhoneInput } from "@/app/lib/formatters";

const themeRing = {
  emerald: "focus:border-emerald-500 focus:ring-emerald-500",
  blue: "focus:border-blue-500 focus:ring-blue-500",
} as const;

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  theme?: "emerald" | "blue";
};

export const formatPhone = formatPhoneInput;

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) {
    return "올바른 휴대폰번호를 입력해주세요.";
  }
  return null;
}

export default function PhoneInput({
  value,
  onChange,
  disabled = false,
  id,
  theme = "emerald",
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validatePhone(value) : null;

  return (
    <div>
      <input
        id={id}
        type="tel"
        value={value}
        onChange={(e) => onChange(formatPhone(e.target.value))}
        onBlur={() => setTouched(true)}
        placeholder="010-0000-0000"
        maxLength={13}
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
