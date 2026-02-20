"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import YearMonthPicker from "./YearMonthPicker";

/* ---------- types ---------- */

type IncomeTab = "earned" | "business" | "daily" | "other";
type ViewMode = "dashboard" | IncomeTab;

interface BusinessEntity {
  id: string;
  businessName: string | null;
  businessNumber: string;
}

interface EarnedIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  payDate: string;
  employeeCode: string;
  employeeName: string;
  department: string | null;
  position: string | null;
  baseSalary: string;
  bonus: string;
  mealAllowance: string;
  allowance: string;
  travelExpense: string;
  totalPayment: string;
  nationalPensionDeduction: string;
  healthInsurance: string;
  employmentInsurance: string;
  longTermCareInsurance: string;
  incomeTax: string;
  localIncomeTax: string;
  totalDeduction: string;
  netPayment: string;
}

interface BusinessIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  employeeCode: string;
  employeeName: string;
  grossPayment: string;
  incomeTax: string;
  localIncomeTax: string;
  expenseArtSpec: string;
  employmentIns: string;
  studentLoan: string;
  industrialAcc: string;
  netPayment: string;
}

interface DailyIncomeLaborRow {
  id: string;
  employeeCode: string;
  employeeName: string;
  jobType: string | null;
  position: string | null;
  identificationNumber: string | null;
  address: string | null;
  phone: string | null;
  joinDate: string | null;
  workDays: number | null;
  normalHours: string | null;
  overtimeHours: string | null;
  grossPay: string;
  employmentIns: string;
  nationalPension: string;
  healthIns: string;
  incomeTax: string;
  localIncomeTax: string;
  longTermCare: string;
  netPay: string;
}

interface OtherIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  employeeCode: string;
  employeeName: string;
  incomeType: string;
  grossPayment: string;
  taxCorpTax: string;
  localIncomeTax: string;
  netPayment: string;
}

interface EarnedApiResponse {
  businessEntity: BusinessEntity;
  rows: EarnedIncomeRow[];
  total: number;
  page: number;
  size: number;
}

interface BusinessApiResponse {
  businessEntity: BusinessEntity;
  rows: BusinessIncomeRow[];
  total: number;
  page: number;
  size: number;
}

interface DailyApiResponse {
  businessEntity: BusinessEntity;
  rows: DailyIncomeLaborRow[];
  total: number;
  page: number;
  size: number;
}

interface OtherApiResponse {
  businessEntity: BusinessEntity;
  rows: OtherIncomeRow[];
  total: number;
  page: number;
  size: number;
}

/* ---------- helpers ---------- */

/** 202601 → "2026-01" */
function formatYm(ym: number): string {
  const s = String(ym);
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** 숫자 문자열 → 세자리 콤마 */
function formatNumber(v: string | number): string {
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString("ko-KR");
}

/** "4780590609" → "478-59-00609" */
function formatBusinessNumber(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 10) return v;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/* ---------- icons (inline SVG) ---------- */

function IconSearch() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx={11} cy={11} r={8} />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}

/* ---------- summary card ---------- */

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: "blue" | "emerald" | "rose";
  icon: React.ReactNode;
}) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
    rose: "from-rose-500 to-rose-600 shadow-rose-200",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${colorMap[color]} p-5 text-white shadow-lg`}
    >
      <div className="absolute -right-3 -top-3 opacity-10">
        <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={12} />
        </svg>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/20 p-2.5">{icon}</div>
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Earned Income Table ---------- */

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-400">데이터가 없습니다</p>
        </div>
      </td>
    </tr>
  );
}

function EarnedIncomeTable({
  rows,
  formatYm,
  formatNumber,
}: {
  rows: EarnedIncomeRow[];
  formatYm: (ym: number) => string;
  formatNumber: (v: string | number) => string;
}) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      baseSalary: rows.reduce((s, r) => s + Number(r.baseSalary), 0),
      bonus: rows.reduce((s, r) => s + Number(r.bonus), 0),
      mealAllowance: rows.reduce((s, r) => s + Number(r.mealAllowance), 0),
      allowance: rows.reduce((s, r) => s + Number(r.allowance), 0),
      travelExpense: rows.reduce((s, r) => s + Number(r.travelExpense), 0),
      totalPayment: rows.reduce((s, r) => s + Number(r.totalPayment), 0),
      nationalPensionDeduction: rows.reduce(
        (s, r) => s + Number(r.nationalPensionDeduction),
        0,
      ),
      healthInsurance: rows.reduce((s, r) => s + Number(r.healthInsurance), 0),
      employmentInsurance: rows.reduce(
        (s, r) => s + Number(r.employmentInsurance),
        0,
      ),
      longTermCareInsurance: rows.reduce(
        (s, r) => s + Number(r.longTermCareInsurance),
        0,
      ),
      incomeTax: rows.reduce((s, r) => s + Number(r.incomeTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      totalDeduction: rows.reduce((s, r) => s + Number(r.totalDeduction), 0),
      netPayment: rows.reduce((s, r) => s + Number(r.netPayment), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-400 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={7}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={6}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급 항목
          </th>
          <th
            colSpan={7}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500"
          >
            공제 항목
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            귀속년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급일
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            사원코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            사원명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            부서
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직급
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            기본급
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            상여
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            식대
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            수당
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            출장비
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액계
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            국민연금
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            건강보험
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            고용보험
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            장기요양
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-rose-500">
            공제액계
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={21} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.accrualYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.paymentYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">
                {new Date(row.payDate).toLocaleDateString("ko-KR")}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.department ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.position ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.baseSalary)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.bonus)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.mealAllowance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.allowance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.travelExpense)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.totalPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.nationalPensionDeduction)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.healthInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.employmentInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.longTermCareInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.incomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-rose-600">
                {formatNumber(row.totalDeduction)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPayment)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={7}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.baseSalary)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.bonus)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.mealAllowance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.allowance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.travelExpense)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.totalPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.nationalPensionDeduction)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.healthInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.employmentInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.longTermCareInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.incomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-rose-600">
              {formatNumber(sum.totalDeduction)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPayment)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/* ---------- Business Income Table ---------- */

function BusinessIncomeTable({
  rows,
  formatYm,
  formatNumber,
}: {
  rows: BusinessIncomeRow[];
  formatYm: (ym: number) => string;
  formatNumber: (v: string | number) => string;
}) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      grossPayment: rows.reduce((s, r) => s + Number(r.grossPayment), 0),
      incomeTax: rows.reduce((s, r) => s + Number(r.incomeTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      expenseArtSpec: rows.reduce((s, r) => s + Number(r.expenseArtSpec), 0),
      employmentIns: rows.reduce((s, r) => s + Number(r.employmentIns), 0),
      studentLoan: rows.reduce((s, r) => s + Number(r.studentLoan), 0),
      industrialAcc: rows.reduce((s, r) => s + Number(r.industrialAcc), 0),
      netPayment: rows.reduce((s, r) => s + Number(r.netPayment), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-225 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={4}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급
          </th>
          <th
            colSpan={6}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500"
          >
            공제 항목
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            귀속년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            성명
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            예술/특고인 경비
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            고용보험료
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            학자금상환액
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            산재보험료
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={12} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.accrualYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.paymentYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.grossPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.incomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.expenseArtSpec)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.employmentIns)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.studentLoan)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.industrialAcc)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPayment)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={4}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.grossPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.incomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.expenseArtSpec)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.employmentIns)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.studentLoan)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.industrialAcc)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPayment)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/* ---------- Other Income Table ---------- */

function OtherIncomeTable({
  rows,
  formatYm,
  formatNumber,
}: {
  rows: OtherIncomeRow[];
  formatYm: (ym: number) => string;
  formatNumber: (v: string | number) => string;
}) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      grossPayment: rows.reduce((s, r) => s + Number(r.grossPayment), 0),
      taxCorpTax: rows.reduce((s, r) => s + Number(r.taxCorpTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      netPayment: rows.reduce((s, r) => s + Number(r.netPayment), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-200 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={5}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급
          </th>
          <th
            colSpan={2}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500"
          >
            공제 항목
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            귀속년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            성명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            소득구분
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세/법인세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={9} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.accrualYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.paymentYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {row.incomeType}
                </span>
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.grossPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.taxCorpTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPayment)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={5}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.grossPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.taxCorpTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPayment)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/* ---------- Daily Income Labor Table ---------- */

function DailyIncomeLaborTable({
  rows,
  formatNumber,
}: {
  rows: DailyIncomeLaborRow[];
  formatNumber: (v: string | number) => string;
}) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      workDays: rows.reduce((s, r) => s + (r.workDays ?? 0), 0),
      normalHours: rows.reduce((s, r) => s + Number(r.normalHours ?? 0), 0),
      overtimeHours: rows.reduce((s, r) => s + Number(r.overtimeHours ?? 0), 0),
      grossPay: rows.reduce((s, r) => s + Number(r.grossPay), 0),
      employmentIns: rows.reduce((s, r) => s + Number(r.employmentIns), 0),
      nationalPension: rows.reduce((s, r) => s + Number(r.nationalPension), 0),
      healthIns: rows.reduce((s, r) => s + Number(r.healthIns), 0),
      incomeTax: rows.reduce((s, r) => s + Number(r.incomeTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      longTermCare: rows.reduce((s, r) => s + Number(r.longTermCare), 0),
      netPay: rows.reduce((s, r) => s + Number(r.netPay), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-350 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={4}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={3}
            className="border-l border-gray-100 bg-indigo-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-indigo-600"
          >
            근무
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급
          </th>
          <th
            colSpan={6}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500"
          >
            공제 항목
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            성명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직종
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직급
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            근무일수
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            정상시간
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            연장시간
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            급여총액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            고용보험료
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            국민연금
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            건강보험료
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-rose-500">
            요양보험
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={15} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.jobType ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.position ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-700">
                {row.workDays ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {row.normalHours != null ? (
                  formatNumber(row.normalHours)
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {row.overtimeHours != null ? (
                  formatNumber(row.overtimeHours)
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.grossPay)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.employmentIns)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.nationalPension)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.healthIns)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.incomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.longTermCare)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPay)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={4}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.workDays)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.normalHours)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.overtimeHours)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.grossPay)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.employmentIns)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.nationalPension)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.healthIns)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.incomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-rose-600">
              {formatNumber(sum.longTermCare)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPay)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/* ---------- dashboard card ---------- */

const INCOME_META: Record<
  IncomeTab,
  { label: string; gradient: string; shadowColor: string; iconPath: string }
> = {
  earned: {
    label: "근로소득",
    gradient: "from-blue-500 to-blue-600",
    shadowColor: "shadow-blue-200",
    iconPath:
      "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
  },
  business: {
    label: "사업소득",
    gradient: "from-violet-500 to-violet-600",
    shadowColor: "shadow-violet-200",
    iconPath:
      "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0",
  },
  daily: {
    label: "일용직소득",
    gradient: "from-amber-500 to-amber-600",
    shadowColor: "shadow-amber-200",
    iconPath:
      "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743",
  },
  other: {
    label: "기타소득",
    gradient: "from-teal-500 to-teal-600",
    shadowColor: "shadow-teal-200",
    iconPath:
      "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z",
  },
};

interface IncomeSummary {
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  count: number;
}

function DashboardCard({
  tab,
  summary,
  loading,
  onClick,
}: {
  tab: IncomeTab;
  summary: IncomeSummary | null;
  loading: boolean;
  onClick: () => void;
}) {
  const meta = INCOME_META[tab];
  const disabled = !loading && !summary;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 text-left transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:ring-gray-950/10 active:scale-[0.99]"
      }`}
    >
      {/* 상단 아이콘 + 제목 */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${meta.gradient} text-white shadow-lg ${meta.shadowColor}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={meta.iconPath}
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{meta.label}</h3>
          {loading ? (
            <p className="text-xs text-gray-400">불러오는 중…</p>
          ) : (
            <p className="text-xs text-gray-400">
              {summary ? `${summary.count.toLocaleString()}건` : "데이터 없음"}
            </p>
          )}
        </div>
        <svg
          className="ml-auto h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </div>

      {/* 금액 요약 */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      ) : summary ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">총 지급액</span>
            <span className="text-sm font-semibold tabular-nums text-blue-700">
              ₩ {formatNumber(summary.totalPayment)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">총 공제액</span>
            <span className="text-sm font-semibold tabular-nums text-rose-600">
              ₩ {formatNumber(summary.totalDeduction)}
            </span>
          </div>
          <div className="mt-1 border-t border-gray-100 pt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              차인지급액
            </span>
            <span className="text-base font-bold tabular-nums text-emerald-700">
              ₩ {formatNumber(summary.netPayment)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-sm text-gray-300">데이터가 없습니다</p>
        </div>
      )}
    </button>
  );
}

/* ---------- page ---------- */

export default function EarnedIncomePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? "1");
  const filterAccrualYm = searchParams.get("accrualYm") ?? "";
  const filterPaymentYm = searchParams.get("paymentYm") ?? "";
  const viewMode: ViewMode =
    (searchParams.get("tab") as ViewMode) || "dashboard";

  const [earnedData, setEarnedData] = useState<EarnedApiResponse | null>(null);
  const [businessData, setBusinessData] = useState<BusinessApiResponse | null>(
    null,
  );
  const [dailyData, setDailyData] = useState<DailyApiResponse | null>(null);
  const [otherData, setOtherData] = useState<OtherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* 필터 입력 상태 */
  const [accrualInput, setAccrualInput] = useState(filterAccrualYm);
  const [paymentInput, setPaymentInput] = useState(filterPaymentYm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("size", "50");
      if (filterAccrualYm) params.set("accrualYm", filterAccrualYm);
      if (filterPaymentYm) params.set("paymentYm", filterPaymentYm);

      if (viewMode === "dashboard") {
        // 대시보드: 4개 소득유형 모두 조회
        const endpoints = {
          earned: `/api/company/${id}/earned-income?${params}`,
          business: `/api/company/${id}/business-income?${params}`,
          daily: `/api/company/${id}/daily-income-labor?${params}`,
          other: `/api/company/${id}/other-income?${params}`,
        };
        const [earnedRes, businessRes, dailyRes, otherRes] = await Promise.all([
          fetch(endpoints.earned),
          fetch(endpoints.business),
          fetch(endpoints.daily),
          fetch(endpoints.other),
        ]);
        if (earnedRes.ok) setEarnedData(await earnedRes.json());
        else setEarnedData(null);
        if (businessRes.ok) setBusinessData(await businessRes.json());
        else setBusinessData(null);
        if (dailyRes.ok) setDailyData(await dailyRes.json());
        else setDailyData(null);
        if (otherRes.ok) setOtherData(await otherRes.json());
        else setOtherData(null);
      } else {
        // 상세: 선택된 소득유형만 조회
        const endpointMap: Record<IncomeTab, string> = {
          earned: `/api/company/${id}/earned-income?${params}`,
          business: `/api/company/${id}/business-income?${params}`,
          daily: `/api/company/${id}/daily-income-labor?${params}`,
          other: `/api/company/${id}/other-income?${params}`,
        };
        const res = await fetch(endpointMap[viewMode]);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        if (viewMode === "business") {
          setBusinessData(await res.json());
        } else if (viewMode === "daily") {
          setDailyData(await res.json());
        } else if (viewMode === "other") {
          setOtherData(await res.json());
        } else {
          setEarnedData(await res.json());
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, currentPage, filterAccrualYm, filterPaymentYm, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* 필터/페이지 변경 → URL 업데이트 */
  function navigate(overrides: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!overrides.page) next.set("page", "1");
    // 탭 유지
    if (viewMode !== "dashboard") next.set("tab", viewMode);
    router.push(`?${next.toString()}`);
  }

  function switchTab(tab: IncomeTab) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    next.set("page", "1");
    router.push(`?${next.toString()}`);
  }

  function goToDashboard() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tab");
    next.set("page", "1");
    router.push(`?${next.toString()}`);
  }

  const activeTab = viewMode !== "dashboard" ? viewMode : null;

  const data =
    activeTab === "business"
      ? businessData
      : activeTab === "daily"
        ? dailyData
        : activeTab === "other"
          ? otherData
          : activeTab === "earned"
            ? earnedData
            : null;
  const totalPages = data ? Math.ceil(data.total / data.size) : 0;

  /* businessEntity — 아무 응답에서든 가져오기 */
  const businessEntity =
    earnedData?.businessEntity ??
    businessData?.businessEntity ??
    dailyData?.businessEntity ??
    otherData?.businessEntity ??
    null;

  /** "202601" → ±1개월 이동한 "YYYYMM" 문자열 */
  function shiftYm(ym: string, delta: number): string {
    if (!ym || ym.length !== 6) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1 + delta;
      const d = new Date(y, m - 1, 1);
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    const y = Number(ym.slice(0, 4));
    const m = Number(ym.slice(4, 6)) + delta;
    const d = new Date(y, m - 1, 1);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function navigateMonth(delta: number) {
    const nextAccrual = shiftYm(accrualInput || filterAccrualYm, delta);
    const nextPayment = shiftYm(paymentInput || filterPaymentYm, delta);
    setAccrualInput(nextAccrual);
    setPaymentInput(nextPayment);
    navigate({ accrualYm: nextAccrual, paymentYm: nextPayment });
  }

  /* 페이지 번호 목록 생성 */
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
      );
    }
    return pages;
  }, [currentPage, totalPages]);

  /* 합계 계산 – 근로소득 */
  const earnedSummary = useMemo<IncomeSummary | null>(() => {
    if (!earnedData?.rows.length) return null;
    return {
      totalPayment: earnedData.rows.reduce(
        (s, r) => s + Number(r.totalPayment),
        0,
      ),
      totalDeduction: earnedData.rows.reduce(
        (s, r) => s + Number(r.totalDeduction),
        0,
      ),
      netPayment: earnedData.rows.reduce((s, r) => s + Number(r.netPayment), 0),
      count: earnedData.total,
    };
  }, [earnedData]);

  /* 합계 계산 – 사업소득 */
  const businessSummary = useMemo<IncomeSummary | null>(() => {
    if (!businessData?.rows.length) return null;
    const totalDeduction = businessData.rows.reduce(
      (s, r) =>
        s +
        Number(r.incomeTax) +
        Number(r.localIncomeTax) +
        Number(r.expenseArtSpec) +
        Number(r.employmentIns) +
        Number(r.studentLoan) +
        Number(r.industrialAcc),
      0,
    );
    return {
      totalPayment: businessData.rows.reduce(
        (s, r) => s + Number(r.grossPayment),
        0,
      ),
      totalDeduction,
      netPayment: businessData.rows.reduce(
        (s, r) => s + Number(r.netPayment),
        0,
      ),
      count: businessData.total,
    };
  }, [businessData]);

  /* 합계 계산 – 일용직소득 */
  const dailySummary = useMemo<IncomeSummary | null>(() => {
    if (!dailyData?.rows.length) return null;
    const totalDeduction = dailyData.rows.reduce(
      (s, r) =>
        s +
        Number(r.employmentIns) +
        Number(r.nationalPension) +
        Number(r.healthIns) +
        Number(r.incomeTax) +
        Number(r.localIncomeTax) +
        Number(r.longTermCare),
      0,
    );
    return {
      totalPayment: dailyData.rows.reduce((s, r) => s + Number(r.grossPay), 0),
      totalDeduction,
      netPayment: dailyData.rows.reduce((s, r) => s + Number(r.netPay), 0),
      count: dailyData.total,
    };
  }, [dailyData]);

  /* 합계 계산 – 기타소득 */
  const otherSummary = useMemo<IncomeSummary | null>(() => {
    if (!otherData?.rows.length) return null;
    const totalDeduction = otherData.rows.reduce(
      (s, r) => s + Number(r.taxCorpTax) + Number(r.localIncomeTax),
      0,
    );
    return {
      totalPayment: otherData.rows.reduce(
        (s, r) => s + Number(r.grossPayment),
        0,
      ),
      totalDeduction,
      netPayment: otherData.rows.reduce((s, r) => s + Number(r.netPayment), 0),
      count: otherData.total,
    };
  }, [otherData]);

  const summaryMap: Record<IncomeTab, IncomeSummary | null> = {
    earned: earnedSummary,
    business: businessSummary,
    daily: dailySummary,
    other: otherSummary,
  };

  /* 전체 합산 */
  const grandTotal = useMemo<IncomeSummary | null>(() => {
    const all = [earnedSummary, businessSummary, dailySummary, otherSummary];
    const valid = all.filter(Boolean) as IncomeSummary[];
    if (!valid.length) return null;
    return {
      totalPayment: valid.reduce((s, v) => s + v.totalPayment, 0),
      totalDeduction: valid.reduce((s, v) => s + v.totalDeduction, 0),
      netPayment: valid.reduce((s, v) => s + v.netPayment, 0),
      count: valid.reduce((s, v) => s + v.count, 0),
    };
  }, [earnedSummary, businessSummary, dailySummary, otherSummary]);

  const currentSummary = activeTab ? summaryMap[activeTab] : null;

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-450 p-6 lg:p-8">
        {/* 헤더 영역 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <IconBuilding />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                급여 명세
              </h1>
              {businessEntity && (
                <p className="text-sm text-gray-500">
                  {businessEntity.businessName ?? "이름 없음"}
                  <span className="mx-1.5 text-gray-300">•</span>
                  <span className="font-mono text-xs text-gray-400">
                    {formatBusinessNumber(businessEntity.businessNumber)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* 귀속/지급년월 필터 */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              title="이전월"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
            >
              <IconChevronLeft />
            </button>

            <YearMonthPicker
              label="귀속년월"
              placeholder="선택하세요"
              value={accrualInput}
              onChange={(v) => {
                setAccrualInput(v);
                setPaymentInput(v);
              }}
            />
            <YearMonthPicker
              label="지급년월"
              placeholder="선택하세요"
              value={paymentInput}
              onChange={setPaymentInput}
            />

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              title="다음월"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
            >
              <IconChevronRight />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate({
                  accrualYm: accrualInput,
                  paymentYm: paymentInput,
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98]"
            >
              <IconSearch />
              조회
            </button>
          </div>
        </div>

        {/* ===== 대시보드 뷰 ===== */}
        {viewMode === "dashboard" && (
          <>
            {/* 전체 합산 요약 카드 */}
            {grandTotal && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="총 지급액"
                  value={`₩ ${formatNumber(grandTotal.totalPayment)}`}
                  color="blue"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  }
                />
                <SummaryCard
                  label="총 공제액"
                  value={`₩ ${formatNumber(grandTotal.totalDeduction)}`}
                  color="rose"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  }
                />
                <SummaryCard
                  label="차인지급액"
                  value={`₩ ${formatNumber(grandTotal.netPayment)}`}
                  color="emerald"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                      />
                    </svg>
                  }
                />
              </div>
            )}

            {/* 소득유형별 카드 */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
                  <p className="text-sm text-gray-400">데이터를 불러오는 중…</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <svg
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(["earned", "business", "daily", "other"] as IncomeTab[]).map(
                  (tab) => (
                    <DashboardCard
                      key={tab}
                      tab={tab}
                      summary={summaryMap[tab]}
                      loading={false}
                      onClick={() => switchTab(tab)}
                    />
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* ===== 상세 뷰 ===== */}
        {activeTab && (
          <>
            {/* 돌아가기 + 탭 제목 */}
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={goToDashboard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
              >
                <IconChevronLeft />
                대시보드
              </button>
              <div
                className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${INCOME_META[activeTab].gradient} px-4 py-1.5 text-sm font-semibold text-white shadow-sm`}
              >
                {INCOME_META[activeTab].label}
              </div>
            </div>

            {/* 요약 카드 */}
            {currentSummary && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="총 지급액"
                  value={`₩ ${formatNumber(currentSummary.totalPayment)}`}
                  color="blue"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  }
                />
                <SummaryCard
                  label="총 공제액"
                  value={`₩ ${formatNumber(currentSummary.totalDeduction)}`}
                  color="rose"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  }
                />
                <SummaryCard
                  label="차인지급액"
                  value={`₩ ${formatNumber(currentSummary.netPayment)}`}
                  color="emerald"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                      />
                    </svg>
                  }
                />
              </div>
            )}

            {/* 메인 카드 */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
              {/* 건수 표시 */}
              {data && !loading && (
                <div className="flex items-center justify-end border-b border-gray-100 px-6 py-3">
                  <p className="text-sm text-gray-500">
                    총{" "}
                    <span className="font-semibold text-gray-800">
                      {data.total.toLocaleString()}
                    </span>
                    건
                    {totalPages > 1 && (
                      <span className="ml-2 text-gray-400">
                        (페이지 {currentPage} / {totalPages})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* 상태 */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
                    <p className="text-sm text-gray-400">
                      데이터를 불러오는 중…
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                      <svg
                        className="h-6 w-6 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* 테이블 */}
              {!loading && !error && data && (
                <>
                  <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                    {activeTab === "earned" ? (
                      <EarnedIncomeTable
                        rows={earnedData?.rows ?? []}
                        formatYm={formatYm}
                        formatNumber={formatNumber}
                      />
                    ) : activeTab === "daily" ? (
                      <DailyIncomeLaborTable
                        rows={dailyData?.rows ?? []}
                        formatNumber={formatNumber}
                      />
                    ) : activeTab === "other" ? (
                      <OtherIncomeTable
                        rows={otherData?.rows ?? []}
                        formatYm={formatYm}
                        formatNumber={formatNumber}
                      />
                    ) : (
                      <BusinessIncomeTable
                        rows={businessData?.rows ?? []}
                        formatYm={formatYm}
                        formatNumber={formatNumber}
                      />
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                      <p className="text-xs text-gray-400">
                        {(currentPage - 1) * (data?.size ?? 50) + 1}–
                        {Math.min(
                          currentPage * (data?.size ?? 50),
                          data?.total ?? 0,
                        )}
                        건 표시 중
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={currentPage <= 1}
                          onClick={() =>
                            navigate({ page: String(currentPage - 1) })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <IconChevronLeft />
                        </button>
                        {pageNumbers.map((p, i) =>
                          p === "..." ? (
                            <span
                              key={`dots-${i}`}
                              className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
                            >
                              ···
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => navigate({ page: String(p) })}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                currentPage === p
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            navigate({ page: String(currentPage + 1) })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <IconChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
