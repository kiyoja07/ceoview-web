import type {
  AccountCatalogRow,
  AccountMeta,
  JournalLine,
  MonthlyPoint,
  NamedAmount,
  ParsedFinancialReport,
  PairedEntry,
  ReportSummary,
} from "./types";

const EMPTY_META: AccountMeta = {
  standardName: null,
  usage: null,
  isRevenue: false,
  isExpense: false,
};

export function buildCatalogMap(
  rows: AccountCatalogRow[],
): Map<string, AccountMeta> {
  const map = new Map<string, AccountMeta>();
  for (const row of rows) {
    map.set(row.code, {
      standardName: row.standardName,
      usage: row.usage,
      isRevenue: row.isRevenue,
      isExpense: row.isExpense,
    });
  }
  return map;
}

// 구분자: YY-MM-DD-NNNNN (BunGaeJang 노트북 셀 3)
function makeGubunja(year: number | null, date: string, voucher: string): string {
  const yy = year != null ? String(year).slice(-2) : "00";
  const mm = date.slice(0, 2);
  const dd = date.slice(-2);
  const v = String(voucher || "").padStart(5, "0");
  return `${yy}-${mm}-${dd}-${v}`;
}

// 년월: "2025년 1월" (앞 0 제거)
function makeYearMonth(year: number | null, date: string): string | null {
  if (year == null) return null;
  const month = Number.parseInt(date.slice(0, 2), 10);
  if (Number.isNaN(month)) return null;
  return `${year}년 ${month}월`;
}

/**
 * 분개장 라인을 구분자 기준으로 그룹핑해 차변/대변을 짝짓고,
 * 원본 라인으로부터 차트/대시보드용 요약을 함께 집계한다.
 *
 * 짝짓기 규칙(노트북 셀 5~6의 개선판): 차변 라인마다 1행을 생성하고,
 * 같은 구분자의 대변 중 금액이 일치하는 라인(없으면 첫 대변)을 붙인다.
 * → 차변 금액이 중복 집계되지 않아 합계가 원장과 정확히 일치.
 */
export function pairAndSummarize(
  lines: JournalLine[],
  fiscalYear: number | null,
  catalog: Map<string, AccountMeta>,
): ParsedFinancialReport {
  const metaOf = (code: string): AccountMeta => catalog.get(code) ?? EMPTY_META;

  // 구분자별 그룹
  const groups = new Map<string, { debits: JournalLine[]; credits: JournalLine[] }>();
  const order: string[] = [];
  for (const line of lines) {
    const key = makeGubunja(fiscalYear, line.date, line.voucherNo);
    let group = groups.get(key);
    if (!group) {
      group = { debits: [], credits: [] };
      groups.set(key, group);
      order.push(key);
    }
    (line.side === "차변" ? group.debits : group.credits).push(line);
  }

  const entries: PairedEntry[] = [];
  let rowIndex = 0;

  const pushEntry = (
    key: string,
    debit: JournalLine | null,
    credit: JournalLine | null,
  ) => {
    const anchor = debit ?? credit;
    if (!anchor) return;
    const dMeta = debit ? metaOf(debit.accountCode) : EMPTY_META;
    const cMeta = credit ? metaOf(credit.accountCode) : EMPTY_META;
    entries.push({
      rowIndex: rowIndex++,
      gubunja: key,
      yearMonth: makeYearMonth(fiscalYear, anchor.date),
      entryDate: anchor.date,
      voucherNo: anchor.voucherNo || null,
      debitCode: debit?.accountCode ?? null,
      debitAccount: debit?.accountName ?? null,
      debitAmount: debit?.amount ?? 0,
      debitStandardName: dMeta.standardName,
      debitUsage: dMeta.usage,
      debitIsRevenue: dMeta.isRevenue,
      debitIsExpense: dMeta.isExpense,
      debitPartnerCode: debit?.partnerCode ?? null,
      debitPartnerName: debit?.partnerName ?? null,
      creditCode: credit?.accountCode ?? null,
      creditAccount: credit?.accountName ?? null,
      creditAmount: credit?.amount ?? 0,
      creditStandardName: cMeta.standardName,
      creditIsRevenue: cMeta.isRevenue,
      creditPartnerCode: credit?.partnerCode ?? null,
      creditPartnerName: credit?.partnerName ?? null,
    });
  };

  for (const key of order) {
    const group = groups.get(key)!;
    if (group.debits.length === 0) {
      for (const credit of group.credits) pushEntry(key, null, credit);
      continue;
    }
    for (const debit of group.debits) {
      let credit: JournalLine | null = null;
      if (group.credits.length === 1) {
        credit = group.credits[0];
      } else if (group.credits.length > 1) {
        credit =
          group.credits.find((c) => c.amount === debit.amount) ??
          group.credits[0];
      }
      pushEntry(key, debit, credit);
    }
  }

  // ── 요약 집계(원본 라인 기준: 비용=차변 isExpense, 수익=대변 isRevenue) ──
  const monthlyMap = new Map<string, MonthlyPoint>();
  const usageMap = new Map<string, number>();
  const debitAccountMap = new Map<string, number>();
  const partnerMap = new Map<string, number>();
  let debitTotal = 0;
  let creditTotal = 0;
  let expenseTotal = 0;
  let revenueTotal = 0;

  const monthKey = (line: JournalLine) =>
    makeYearMonth(fiscalYear, line.date) ?? "미상";

  for (const line of lines) {
    const meta = metaOf(line.accountCode);
    const ym = monthKey(line);
    const point =
      monthlyMap.get(ym) ??
      ({ ym, debit: 0, credit: 0, expense: 0, revenue: 0 } as MonthlyPoint);

    if (line.side === "차변") {
      debitTotal += line.amount;
      point.debit += line.amount;
      if (meta.isExpense) {
        expenseTotal += line.amount;
        point.expense += line.amount;
      }
      if (meta.usage) {
        usageMap.set(meta.usage, (usageMap.get(meta.usage) ?? 0) + line.amount);
      }
      const accName = meta.standardName ?? line.accountName ?? "미분류";
      debitAccountMap.set(
        accName,
        (debitAccountMap.get(accName) ?? 0) + line.amount,
      );
    } else {
      creditTotal += line.amount;
      point.credit += line.amount;
      if (meta.isRevenue) {
        revenueTotal += line.amount;
        point.revenue += line.amount;
      }
    }

    monthlyMap.set(ym, point);

    if (line.partnerName) {
      partnerMap.set(
        line.partnerName,
        (partnerMap.get(line.partnerName) ?? 0) + line.amount,
      );
    }
  }

  const toSortedTop = (map: Map<string, number>, top: number): NamedAmount[] =>
    [...map.entries()]
      .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, top);

  // "2025년 1월" → 202501 (정렬 키)
  const ymSortKey = (ym: string): number => {
    const m = ym.match(/(\d+)년\s*(\d+)월/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return Number.parseInt(m[1], 10) * 100 + Number.parseInt(m[2], 10);
  };

  const monthly = [...monthlyMap.values()]
    .map((p) => ({
      ym: p.ym,
      debit: Math.round(p.debit),
      credit: Math.round(p.credit),
      expense: Math.round(p.expense),
      revenue: Math.round(p.revenue),
    }))
    .sort((a, b) => ymSortKey(a.ym) - ymSortKey(b.ym));

  const summary: ReportSummary = {
    fiscalYear,
    monthly,
    byUsage: toSortedTop(usageMap, 10),
    topDebitAccounts: toSortedTop(debitAccountMap, 12),
    topPartners: toSortedTop(partnerMap, 12),
    expenseTotal: Math.round(expenseTotal),
    revenueTotal: Math.round(revenueTotal),
  };

  return {
    fiscalYear,
    entries,
    summary,
    debitTotal: Math.round(debitTotal),
    creditTotal: Math.round(creditTotal),
    entryCount: entries.length,
  };
}
