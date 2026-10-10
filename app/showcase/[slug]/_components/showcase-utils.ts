import type { AgentCompanyListItem } from "@/types/agent/company";
import type { ShowcaseAgentCompanyRow, ShowcaseMetric } from "@/types/showcase";
import type {
  EarnedApiResponse,
  EarnedIncomeRow,
  IncomeSummary,
  MonthlyStat,
} from "@/types/company/salary";
import { formatCurrencyKRW } from "@/app/lib/formatters";
import type { getShowcaseBySlug } from "@/catalogs/showcase";

export type ShowcaseScenario = NonNullable<
  ReturnType<typeof getShowcaseBySlug>
>;

export const formatCurrency = formatCurrencyKRW;

export function extractNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function toneFromMetric(
  value: ShowcaseMetric["tone"],
): "emerald" | "blue" | "amber" | "slate" {
  return value ?? "slate";
}

export function buildAgentCompanies(
  companies: ShowcaseAgentCompanyRow[],
): AgentCompanyListItem[] {
  return companies.map((company) => ({
    id: company.id,
    businessNumber: company.businessNumber.replace(/\D/g, ""),
    businessType: company.businessType,
    businessName: company.name,
    representativeName: company.representativeName,
    openingDate: null,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }));
}

export function buildSalaryStats(scenario: ShowcaseScenario): MonthlyStat[] {
  const yearMonths = [202509, 202510, 202511, 202512, 202601, 202602];
  const headcount = extractNumber(scenario.public.headcountLabel) || 42;
  const earnedCount = extractNumber(
    scenario.company.employeeMetrics.find(
      (metric) => metric.label === "재직 중 상시 직원",
    )?.value ?? "32",
  );
  const businessCount = extractNumber(
    scenario.company.employeeMetrics.find(
      (metric) => metric.label === "사업소득자",
    )?.value ?? "4",
  );
  const otherCount = extractNumber(
    scenario.company.employeeMetrics.find(
      (metric) => metric.label === "기타소득자",
    )?.value ?? "3",
  );
  const dailyCount = extractNumber(
    scenario.company.employeeMetrics.find(
      (metric) => metric.label === "일용직소득자",
    )?.value ?? "3",
  );

  return scenario.company.salaryTrend.map((item, index) => {
    const businessPayment =
      index % 3 === 1 ? Math.round(item.grossAmount * 0.1) : 0;
    const dailyPayment =
      index % 4 === 2 ? Math.round(item.grossAmount * 0.06) : 0;
    const otherPayment =
      index % 5 === 0 ? Math.round(item.grossAmount * 0.04) : 0;
    const earnedPayment =
      item.grossAmount - businessPayment - dailyPayment - otherPayment;
    const totalDeduction = item.grossAmount - item.netAmount;

    return {
      ym: yearMonths[index] ?? 202602 + index,
      label: item.label,
      earnedPayment,
      businessPayment,
      dailyPayment,
      otherPayment,
      totalPayment: item.grossAmount,
      totalDeduction,
      netPayment: item.netAmount,
      earnedCount,
      businessCount,
      dailyCount,
      otherCount,
      totalCount: headcount,
    };
  });
}

export function buildSalarySummary(stats: MonthlyStat[]): IncomeSummary {
  const latest = stats[stats.length - 1];
  return {
    totalPayment: latest?.totalPayment ?? 0,
    totalDeduction: latest?.totalDeduction ?? 0,
    netPayment: latest?.netPayment ?? 0,
    count: latest?.totalCount ?? 0,
    companyBurden: Math.round((latest?.totalPayment ?? 0) * 0.11),
  };
}

function buildEarnedRow({
  id,
  accrualYm,
  paymentYm,
  employeeCode,
  employeeName,
  department,
  position,
  totalPayment,
  totalDeduction,
}: {
  id: string;
  accrualYm: number;
  paymentYm: number;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  totalPayment: number;
  totalDeduction: number;
}): EarnedIncomeRow {
  const bonus = Math.round(totalPayment * 0.08);
  const mealAllowance = 200000;
  const allowance = 180000;
  const travelExpense = 120000;
  const baseSalary =
    totalPayment - bonus - mealAllowance - allowance - travelExpense;

  const nationalPensionDeduction = Math.round(totalPayment * 0.045);
  const healthInsurance = Math.round(totalPayment * 0.03545);
  const longTermCareInsurance = Math.round(healthInsurance * 0.1281);
  const employmentInsurance = Math.round(totalPayment * 0.009);
  const statutoryDeduction =
    nationalPensionDeduction +
    healthInsurance +
    longTermCareInsurance +
    employmentInsurance;
  const taxBase = Math.max(0, totalDeduction - statutoryDeduction);
  const incomeTax = Math.round(taxBase * 0.91);
  const localIncomeTax = taxBase - incomeTax;
  const netPayment = totalPayment - totalDeduction;

  return {
    id,
    accrualYm,
    paymentYm,
    payDate: `${String(paymentYm).slice(0, 4)}-${String(paymentYm).slice(4)}-25`,
    employeeCode,
    employeeName,
    department,
    position,
    baseSalary: String(baseSalary),
    bonus: String(bonus),
    mealAllowance: String(mealAllowance),
    allowance: String(allowance),
    travelExpense: String(travelExpense),
    totalPayment: String(totalPayment),
    nationalPensionDeduction: String(nationalPensionDeduction),
    healthInsurance: String(healthInsurance),
    employmentInsurance: String(employmentInsurance),
    longTermCareInsurance: String(longTermCareInsurance),
    incomeTax: String(incomeTax),
    localIncomeTax: String(localIncomeTax),
    studentLoanRepayment: "0",
    totalDeduction: String(totalDeduction),
    netPayment: String(netPayment),
    employeeEmail: `${employeeCode.toLowerCase()}@brickwave.demo`,
    employeePhone: "01012345678",
    lastSentAt: "2025-12-26T09:30:00+09:00",
  };
}

export function buildShowcaseEarnedData(
  scenario: ShowcaseScenario,
): EarnedApiResponse {
  const accrualYm = 202512;
  const paymentYm = 202512;
  const rows = [
    buildEarnedRow({
      id: "earned-001",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-001",
      employeeName: "박서연",
      department: "프로덕트",
      position: "프로덕트 디자이너",
      totalPayment: 5200000,
      totalDeduction: 820000,
    }),
    buildEarnedRow({
      id: "earned-002",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-002",
      employeeName: "이도현",
      department: "개발",
      position: "프론트엔드 엔지니어",
      totalPayment: 4100000,
      totalDeduction: 636000,
    }),
    buildEarnedRow({
      id: "earned-003",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-003",
      employeeName: "정하늘",
      department: "운영",
      position: "운영 매니저",
      totalPayment: 3950000,
      totalDeduction: 592000,
    }),
    buildEarnedRow({
      id: "earned-004",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-004",
      employeeName: "최민재",
      department: "영업",
      position: "어카운트 매니저",
      totalPayment: 4380000,
      totalDeduction: 671000,
    }),
    buildEarnedRow({
      id: "earned-005",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-005",
      employeeName: "오세린",
      department: "재무",
      position: "재무 담당자",
      totalPayment: 3720000,
      totalDeduction: 548000,
    }),
    buildEarnedRow({
      id: "earned-006",
      accrualYm,
      paymentYm,
      employeeCode: "EMP-006",
      employeeName: "한지원",
      department: "마케팅",
      position: "퍼포먼스 마케터",
      totalPayment: 4050000,
      totalDeduction: 615000,
    }),
  ];

  return {
    company: {
      id: "showcase-company-earned",
      businessName: scenario.company.businessName,
      businessNumber: scenario.company.businessNumber.replace(/\D/g, ""),
    },
    rows,
    total: rows.length,
    page: 1,
    size: rows.length,
    publication: {
      publishStatus: "PUBLISHED",
      isAgentView: false,
      companyVisible: true,
      uploadedAt: "2025-12-26T09:00:00+09:00",
    },
  };
}
