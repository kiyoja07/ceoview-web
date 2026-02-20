"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ---------- constants ---------- */

const MONTHS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
] as const;

/* ---------- props ---------- */

interface YearMonthPickerProps {
  /** "202601" 형식 또는 빈 문자열 */
  value: string;
  onChange: (value: string) => void;
  /** 트리거에 표시할 라벨 */
  label: string;
  /** placeholder (값이 없을 때) */
  placeholder?: string;
}

/* ---------- helpers ---------- */

function parseYm(v: string): { year: number; month: number } | null {
  if (!v || v.length !== 6) return null;
  const year = Number(v.slice(0, 4));
  const month = Number(v.slice(4, 6));
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function toYmString(year: number, month: number): string {
  return `${year}${String(month).padStart(2, "0")}`;
}

function formatDisplay(v: string): string {
  const parsed = parseYm(v);
  if (!parsed) return "";
  return `${parsed.year}년 ${parsed.month}월`;
}

/* ---------- component ---------- */

export default function YearMonthPicker({
  value,
  onChange,
  label,
  placeholder = "선택",
}: YearMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseYm(value);
  const [viewYear, setViewYear] = useState(
    parsed?.year ?? new Date().getFullYear(),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  /* click outside to close */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelect = useCallback(
    (month: number) => {
      onChange(toYmString(viewYear, month));
      setOpen(false);
    },
    [viewYear, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setOpen(false);
    },
    [onChange],
  );

  const selectedMonth = parsed?.year === viewYear ? parsed.month : null;

  return (
    <div ref={containerRef} className="relative">
      {/* 라벨 */}
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>

      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => {
          if (!open && parsed) setViewYear(parsed.year);
          setOpen((o) => !o);
        }}
        className={`group inline-flex h-9 w-48 items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-100"
            : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white"
        }`}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </span>
          )}
          {/* calendar icon */}
          <svg
            className={`h-4 w-4 transition-colors ${open ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </span>
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 origin-top-left animate-in fade-in slide-in-from-top-1 rounded-xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-200/50">
          {/* 연도 네비게이션 */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15 19-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-800 tabular-nums">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 5 7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* 월 그리드 */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((name, i) => {
              const month = i + 1;
              const isSelected = selectedMonth === month;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleSelect(month)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
