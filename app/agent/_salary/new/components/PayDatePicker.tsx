"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { PayDatePickerProps } from "../types";

/* ---------- constants ---------- */

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"] as const;

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

/* ---------- helpers ---------- */

function parseDate(
  v: string,
): { year: number; month: number; day: number } | null {
  if (!v) return null;
  const parts = v.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(v: string): string {
  const parsed = parseDate(v);
  if (!parsed) return "";
  return `${parsed.year}년 ${parsed.month}월 ${parsed.day}일`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0 = 일, 1 = 월, ... 6 = 토 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day
  );
}

/* ---------- component ---------- */

export function PayDatePicker({
  value,
  onChange,
  label,
  required = false,
  hint,
}: PayDatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseDate(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(
    parsed?.month ?? now.getMonth() + 1,
  );
  const [showMonthGrid, setShowMonthGrid] = useState(false);
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
        setShowMonthGrid(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowMonthGrid(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelectDay = useCallback(
    (day: number) => {
      onChange(toDateString(viewYear, viewMonth, day));
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const handleClear = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      onChange("");
      setOpen(false);
    },
    [onChange],
  );

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build the calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isSelected = (day: number) =>
    parsed?.year === viewYear &&
    parsed?.month === viewMonth &&
    parsed?.day === day;

  return (
    <div ref={containerRef} className="relative">
      {/* 라벨 */}
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => {
          if (!open && parsed) {
            setViewYear(parsed.year);
            setViewMonth(parsed.month);
          }
          setOpen((o) => !o);
          setShowMonthGrid(false);
        }}
        className={`group inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3.5 text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-100"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDisplay(value) : "날짜를 선택하세요"}
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

      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left rounded-xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-200/50">
          {showMonthGrid ? (
            /* ---------- 월 선택 그리드 ---------- */
            <>
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
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((name, i) => {
                  const month = i + 1;
                  const isCurrentMonth = viewMonth === month;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        setViewMonth(month);
                        setShowMonthGrid(false);
                      }}
                      className={`rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                        isCurrentMonth
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* ---------- 날짜 캘린더 ---------- */
            <>
              {/* 월 네비게이션 */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
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
                <button
                  type="button"
                  onClick={() => setShowMonthGrid(true)}
                  className="rounded-lg px-2 py-1 text-sm font-bold text-gray-800 tabular-nums transition-colors hover:bg-gray-100"
                >
                  {viewYear}년 {viewMonth}월
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
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

              {/* 요일 헤더 */}
              <div className="mb-1 grid grid-cols-7 text-center">
                {DAYS_OF_WEEK.map((d, i) => (
                  <div
                    key={d}
                    className={`py-1 text-xs font-medium ${
                      i === 0
                        ? "text-red-400"
                        : i === 6
                          ? "text-blue-400"
                          : "text-gray-400"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8" />;
                  }
                  const selected = isSelected(day);
                  const today = isToday(viewYear, viewMonth, day);
                  const dayOfWeek = (firstDay + day - 1) % 7;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`flex h-8 w-full items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        selected
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : today
                            ? "bg-blue-50 font-bold text-blue-700 ring-1 ring-blue-200"
                            : dayOfWeek === 0
                              ? "text-red-500 hover:bg-red-50"
                              : dayOfWeek === 6
                                ? "text-blue-500 hover:bg-blue-50"
                                : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* 오늘 버튼 */}
              <div className="mt-3 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date();
                    onChange(
                      toDateString(
                        t.getFullYear(),
                        t.getMonth() + 1,
                        t.getDate(),
                      ),
                    );
                    setOpen(false);
                  }}
                  className="w-full rounded-lg py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  오늘
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
