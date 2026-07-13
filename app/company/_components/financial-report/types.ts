export type MonthlyPoint = {
  ym: string;
  debit: number;
  credit: number;
  expense: number;
  revenue: number;
};
export type NamedAmount = { name: string; amount: number };
export type PivotRow = {
  label: string;
  subLabel: string | null;
  monthly: Record<string, number>;
  total: number;
};
export type PivotTable = {
  months: string[];
  rows: PivotRow[];
  monthlyTotals: Record<string, number>;
  grandTotal: number;
};
export type StandardReports = {
  income: PivotTable;
  incomeByPartner: PivotTable;
  expense: PivotTable;
  expenseByPartner: PivotTable;
  vat: PivotTable;
  cashIn: PivotTable;
  cashOut: PivotTable;
};
export type Summary = {
  fiscalYear: number | null;
  monthly: MonthlyPoint[];
  byUsage: NamedAmount[];
  topDebitAccounts: NamedAmount[];
  topPartners: NamedAmount[];
  expenseTotal: number;
  revenueTotal: number;
  standardReports?: StandardReports;
};
export type Totals = {
  fiscalYear: number | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
};
export type Publication = {
  publishStatus: "NONE" | "SAVED" | "PUBLISHED";
  isAgentView: boolean;
  companyVisible: boolean;
  fiscalYear: number | null;
  uploadedAt: string | null;
  agentOrganizationName?: string | null;
};
export type Entry = {
  rowIndex: number;
  gubunja: string;
  yearMonth: string | null;
  entryDate: string | null;
  voucherNo: string | null;
  debitAccount: string | null;
  debitAmount: number;
  debitStandardName: string | null;
  debitUsage: string | null;
  debitIsRevenue: boolean;
  debitIsExpense: boolean;
  debitPartnerName: string | null;
  creditAccount: string | null;
  creditAmount: number;
  creditPartnerName: string | null;
};

// "상세 보고서" 피벗 표 각각의 제목/열 이름 (대시보드 카드 ↔ 전체 보기 화면 공용)
export const PIVOT_TABLE_CONFIG = {
  income: { title: "1-1. 수익 by 계정", itemHeader: "표준계정과목" },
  incomeByPartner: { title: "1-2. 수익 by 거래처", itemHeader: "거래처" },
  expense: { title: "2-1. 비용 by 계정", itemHeader: "표준계정과목" },
  expenseByPartner: { title: "2-2. 비용 by 거래처", itemHeader: "거래처" },
  vat: { title: "3. 부가세", itemHeader: "구분" },
  cashIn: { title: "4-1. 현금 유입", itemHeader: "상대 거래처" },
  cashOut: { title: "4-2. 현금 유출", itemHeader: "상대 거래처" },
} as const satisfies Record<
  keyof StandardReports,
  { title: string; itemHeader: string }
>;

export type PivotKey = keyof typeof PIVOT_TABLE_CONFIG;

export function isPivotKey(key: string): key is PivotKey {
  return Object.prototype.hasOwnProperty.call(PIVOT_TABLE_CONFIG, key);
}
