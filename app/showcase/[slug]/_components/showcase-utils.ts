import type { AgentCompanyListItem } from "@/types/agent/company";
import type { ShowcaseAgentCompanyRow, ShowcaseMetric } from "@/types/showcase";
import type {
  IncomeSummary,
  MonthlyStat,
} from "@/app/company/[id]/salary/types";
import type { getShowcaseBySlug } from "@/catalogs/showcase";

export type ShowcaseScenario = NonNullable<
  ReturnType<typeof getShowcaseBySlug>
>;

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

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
