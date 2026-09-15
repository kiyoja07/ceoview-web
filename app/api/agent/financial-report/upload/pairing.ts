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
import { buildStandardReports } from "./standard-reports";

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
function makeGubunja(
  year: number | null,
  date: string,
  voucher: string,
): string {
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
 *
 * 대변이 2건 이상인 구분자는 차변마다 하나씩 소비(consume)하며 짝짓고,
 * 끝까지 짝지어지지 못하고 남은 대변은 버리지 않고 별도 행(차변 없음)으로 남긴다.
 * (이전 구현은 짝지어지지 못한 대변을 그냥 버려 원장에는 있는 금액이
 * entries 테이블에서 통째로 누락되는 문제가 있었다.)
 */
export function pairAndSummarize(
  lines: JournalLine[],
  fiscalYear: number | null,
  catalog: Map<string, AccountMeta>,
): ParsedFinancialReport {
  const metaOf = (code: string): AccountMeta => catalog.get(code) ?? EMPTY_META;

  // 구분자별 그룹
  const groups = new Map<
    string,
    { debits: JournalLine[]; credits: JournalLine[] }
  >();
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
      creditUsage: cMeta.usage,
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
    if (group.credits.length <= 1) {
      // 대변이 0~1건이면 모든 차변에 동일한 대변(또는 없음)을 짝짓는다.
      const credit = group.credits[0] ?? null;
      for (const debit of group.debits) {
        pushEntry(key, debit, credit);
      }
      continue;
    }
    // 대변이 여러 건: 차변마다 금액이 일치하는 대변을 우선 소비하고,
    // 일치하는 게 없으면 아직 안 쓰인 대변 중 첫 번째를 소비한다.
    const remainingCredits = [...group.credits];
    for (const debit of group.debits) {
      const matchIndex = remainingCredits.findIndex(
        (c) => c.amount === debit.amount,
      );
      const [matched] =
        matchIndex !== -1
          ? remainingCredits.splice(matchIndex, 1)
          : remainingCredits.length > 0
            ? remainingCredits.splice(0, 1)
            : [null];
      pushEntry(key, debit, matched ?? null);
    }
    // 짝지어지지 못하고 남은 대변은 유실되지 않도록 별도 행으로 남기되,
    // 차변을 비워두지 않고 같은 전표의 마지막 차변을 표시용으로 다시 붙인다.
    // (한 전표 안에서 여러 대변이 하나의 차변 총액을 나눠 구성하는 복합 전표이므로,
    // 차변 계정/금액 정보를 보여주는 게 원장을 읽을 때 더 자연스럽다.)
    const anchorDebit = group.debits[group.debits.length - 1];
    for (const credit of remainingCredits) {
      pushEntry(key, anchorDebit, credit);
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
    standardReports: buildStandardReports(entries),
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
