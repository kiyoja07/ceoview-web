// 프리미엄 재무 리포트(분개장) 파서 관련 타입

export type AccountMeta = {
  standardName: string | null; // 계정과목_표준
  usage: string | null; // 계정용도 (사업/개인/투자)
  isRevenue: boolean; // 수익여부
  isExpense: boolean; // 비용여부
};

// 계정과목 매핑 CSV/엑셀에서 파싱한 한 행
export type AccountCatalogRow = {
  code: string; // 코드
  wehagoName: string | null; // 계정과목_위하고
  category: string | null; // 구분
  isCompanyDefined: boolean; // 회사설정과목여부
  standardName: string | null; // 계정과목_표준
  usage: string | null; // 계정용도
  isRevenue: boolean; // 수익여부
  isExpense: boolean; // 비용여부
  hasVat: boolean; // 부가세여부
};

// 원본 분개장에서 파싱한 한 라인(차변 또는 대변)
export type JournalLine = {
  date: string; // 일자 (예: "01/01")
  voucherNo: string; // 전표번호
  accountCode: string; // 계정코드
  accountName: string; // 계정과목
  amount: number; // 해당 라인의 금액(차변 또는 대변)
  side: "차변" | "대변";
  partnerCode: string | null; // 거래처코드
  partnerName: string | null; // 거래처명
};

// 차변/대변을 짝지은 한 거래 행
export type PairedEntry = {
  rowIndex: number;
  gubunja: string; // 구분자 (YY-MM-DD-NNNNN)
  yearMonth: string | null; // 년월 ("2025년 1월")
  entryDate: string | null; // 일자
  voucherNo: string | null; // 전표번호

  debitCode: string | null;
  debitAccount: string | null;
  debitAmount: number;
  debitStandardName: string | null;
  debitUsage: string | null;
  debitIsRevenue: boolean;
  debitIsExpense: boolean;
  debitPartnerCode: string | null;
  debitPartnerName: string | null;

  creditCode: string | null;
  creditAccount: string | null;
  creditAmount: number;
  creditStandardName: string | null;
  creditUsage: string | null;
  creditIsRevenue: boolean;
  creditPartnerCode: string | null;
  creditPartnerName: string | null;
};

export type MonthlyPoint = {
  ym: string; // "2025년 1월"
  debit: number;
  credit: number;
  expense: number;
  revenue: number;
};

export type NamedAmount = {
  name: string;
  amount: number;
};

// BunGaeJang 노트북 "보고서 양식" 피벗 표 한 행 (계정/거래처 x 년월)
export type PivotRow = {
  label: string; // 계정과목_표준 또는 거래처명
  subLabel: string | null; // 계정용도 (있는 경우)
  monthly: Record<string, number>; // 년월 → 금액
  total: number;
};

export type PivotTable = {
  months: string[]; // 정렬된 년월 목록
  rows: PivotRow[];
  monthlyTotals: Record<string, number>; // 합계 행
  grandTotal: number;
};

// BunGaeJang 노트북 셀 9~34 "보고서 양식으로 변환" 이식
export type StandardReports = {
  income: PivotTable; // 1-1. 수익 by 계정
  incomeByPartner: PivotTable; // 1-2. 수익 by 거래처
  expense: PivotTable; // 2-1. 비용 by 계정
  expenseByPartner: PivotTable; // 2-2. 비용 by 거래처
  vat: PivotTable; // 3. 부가세
  cashIn: PivotTable; // 4-1. 현금 유입
  cashOut: PivotTable; // 4-2. 현금 유출
};

// 파싱 시점에 원본 라인으로부터 집계한 요약(차트/대시보드용)
export type ReportSummary = {
  fiscalYear: number | null;
  monthly: MonthlyPoint[];
  byUsage: NamedAmount[]; // 계정용도별 차변 합계
  topDebitAccounts: NamedAmount[]; // 표준계정과목별 차변 상위
  topPartners: NamedAmount[]; // 거래처별 상위
  expenseTotal: number; // 비용 합계 (차변 라인 중 isExpense)
  revenueTotal: number; // 수익 합계 (대변 라인 중 isRevenue)
  standardReports: StandardReports; // BunGaeJang 보고서 양식
};

export type ParsedFinancialReport = {
  fiscalYear: number | null;
  entries: PairedEntry[];
  summary: ReportSummary;
  debitTotal: number;
  creditTotal: number;
  entryCount: number;
};
