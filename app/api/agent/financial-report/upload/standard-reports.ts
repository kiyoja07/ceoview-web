import type {
  PairedEntry,
  PivotRow,
  PivotTable,
  StandardReports,
} from "./types";

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

  // 페어링 과정에서 대변 1건이 여러 차변에, 혹은 차변 1건이 여러 대변에
  // 재사용되어 같은 (구분자, 계정, 금액) 조합이 여러 entries 행에 걸쳐
  // 중복 등장할 수 있다. 수익/비용 합계(pairing.ts의 revenueTotal/expenseTotal,
  // 원본 라인 기준 집계)와 일치시키려면 그 조합당 한 번만 집계해야 한다.
  const seenCredit = new Set<string>();
  const seenDebit = new Set<string>();

  for (const e of entries) {
    if (!e.yearMonth) continue;
    const ym = e.yearMonth;

    const creditKey = `${e.gubunja}|${e.creditCode ?? ""}|${e.creditAmount}`;
    const isNewCredit = Boolean(e.creditAmount) && !seenCredit.has(creditKey);
    if (e.creditAmount) seenCredit.add(creditKey);

    const debitKey = `${e.gubunja}|${e.debitCode ?? ""}|${e.debitAmount}`;
    const isNewDebit = Boolean(e.debitAmount) && !seenDebit.has(debitKey);
    if (e.debitAmount) seenDebit.add(debitKey);

    // 1. 수익 보고서 (대변 계정이 수익여부인 거래, pairing.ts revenueTotal과 동일 기준)
    if (e.creditIsRevenue && isNewCredit) {
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

    // 2. 비용 보고서 (차변 계정이 비용여부인 거래, pairing.ts expenseTotal과 동일 기준)
    if (e.debitIsExpense && isNewDebit && e.debitStandardName) {
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
