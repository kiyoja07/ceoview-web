import type {
  PairedEntry,
  PivotRow,
  PivotTable,
  StandardReports,
} from "./types";

// BunGaeJang 노트북 셀 21: 비용 집계에서 제외하는 표준계정과목
// (단순이체/미지급금 등 실제 비용이 아닌 정산성 계정)
const EXPENSE_EXCLUDED_ACCOUNTS = new Set([
  "단순이체",
  "미지급금",
  "부가세대급금",
  "부가세예수금",
  "보통예금",
  "가지급금",
  "미수수익",
  "미지급비용",
  "비품",
  "전도금",
  "예수금",
  "외상매출금",
  "선수금",
  "선납세금",
  "선급금",
  "미지급세금",
]);

const BANK_ACCOUNT_NAME = "보통예금";
const VAT_OUTPUT_ACCOUNT = "부가세예수금"; // 대변: 매출세액
const VAT_INPUT_ACCOUNT = "부가세대급금"; // 차변: 매입세액

// "2025년 1월" → 202501 (정렬 키)
function ymSortKey(ym: string): number {
  const m = ym.match(/(\d+)년\s*(\d+)월/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number.parseInt(m[1], 10) * 100 + Number.parseInt(m[2], 10);
}

type PivotItem = {
  label: string;
  subLabel?: string | null;
  ym: string;
  amount: number;
};

function buildPivot(items: PivotItem[]): PivotTable {
  const monthsSet = new Set<string>();
  const rowMap = new Map<string, PivotRow>();
  const monthlyTotals = new Map<string, number>();
  let grandTotal = 0;

  for (const item of items) {
    monthsSet.add(item.ym);
    const key = `${item.subLabel ?? ""}␟${item.label}`;
    let row = rowMap.get(key);
    if (!row) {
      row = {
        label: item.label,
        subLabel: item.subLabel ?? null,
        monthly: {},
        total: 0,
      };
      rowMap.set(key, row);
    }
    row.monthly[item.ym] = (row.monthly[item.ym] ?? 0) + item.amount;
    row.total += item.amount;
    monthlyTotals.set(item.ym, (monthlyTotals.get(item.ym) ?? 0) + item.amount);
    grandTotal += item.amount;
  }

  const months = [...monthsSet].sort((a, b) => ymSortKey(a) - ymSortKey(b));

  const rows = [...rowMap.values()]
    .map((row) => ({
      ...row,
      monthly: Object.fromEntries(
        months.map((m) => [m, Math.round(row.monthly[m] ?? 0)]),
      ),
      total: Math.round(row.total),
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  return {
    months,
    rows,
    monthlyTotals: Object.fromEntries(
      months.map((m) => [m, Math.round(monthlyTotals.get(m) ?? 0)]),
    ),
    grandTotal: Math.round(grandTotal),
  };
}

/**
 * BunGaeJang 노트북 셀 9~34("보고서 양식으로 변환")을 짝지은 거래 목록으로부터 이식한다.
 * - 수익: 계정용도 x 표준계정과목, 거래처명 기준 피벗
 * - 비용: 표준계정과목, 거래처명 기준 피벗
 * - 부가세: 부가세예수금(매출세액)/부가세대급금(매입세액) 기준 피벗
 * - 현금흐름: 보통예금 계정으로 들어오고 나간 거래를 상대 거래처 기준 피벗
 */
export function buildStandardReports(entries: PairedEntry[]): StandardReports {
  const incomeItems: PivotItem[] = [];
  const incomeByPartnerItems: PivotItem[] = [];
  const expenseItems: PivotItem[] = [];
  const expenseByPartnerItems: PivotItem[] = [];
  const vatItems: PivotItem[] = [];
  const cashInItems: PivotItem[] = [];
  const cashOutItems: PivotItem[] = [];

  for (const e of entries) {
    if (!e.yearMonth) continue;
    const ym = e.yearMonth;

    // 1. 수익 보고서 (대변 계정이 수익여부인 거래)
    if (e.creditIsRevenue && e.creditAmount) {
      const label = e.creditStandardName ?? e.creditAccount ?? "미분류";
      incomeItems.push({
        label,
        subLabel: e.creditUsage,
        ym,
        amount: e.creditAmount,
      });
      incomeByPartnerItems.push({
        label: e.creditPartnerName ?? "미상",
        ym,
        amount: e.creditAmount,
      });
    }

    // 2. 비용 보고서 (수익 거래 제외, 정산성 계정 제외)
    if (
      !e.creditIsRevenue &&
      e.debitAmount &&
      e.debitStandardName &&
      !EXPENSE_EXCLUDED_ACCOUNTS.has(e.debitStandardName)
    ) {
      expenseItems.push({
        label: e.debitStandardName,
        ym,
        amount: e.debitAmount,
      });
      expenseByPartnerItems.push({
        label: e.debitPartnerName ?? "미상",
        ym,
        amount: e.debitAmount,
      });
    }

    // 3. 부가세 보고서
    if (e.creditStandardName === VAT_OUTPUT_ACCOUNT && e.creditAmount) {
      vatItems.push({
        label: "매출세액(부가세예수금)",
        ym,
        amount: -e.creditAmount,
      });
    }
    if (e.debitStandardName === VAT_INPUT_ACCOUNT && e.debitAmount) {
      vatItems.push({
        label: "매입세액(부가세대급금)",
        ym,
        amount: e.debitAmount,
      });
    }

    // 4. 현금 흐름 보고서 (보통예금 계정 유출입)
    if (e.debitAccount === BANK_ACCOUNT_NAME && e.debitAmount) {
      cashInItems.push({
        label: e.creditPartnerName ?? e.creditAccount ?? "미상",
        ym,
        amount: e.debitAmount,
      });
    }
    if (e.creditAccount === BANK_ACCOUNT_NAME && e.creditAmount) {
      cashOutItems.push({
        label: e.debitPartnerName ?? e.debitAccount ?? "미상",
        ym,
        amount: e.creditAmount,
      });
    }
  }

  return {
    income: buildPivot(incomeItems),
    incomeByPartner: buildPivot(incomeByPartnerItems),
    expense: buildPivot(expenseItems),
    expenseByPartner: buildPivot(expenseByPartnerItems),
    vat: buildPivot(vatItems),
    cashIn: buildPivot(cashInItems),
    cashOut: buildPivot(cashOutItems),
  };
}
