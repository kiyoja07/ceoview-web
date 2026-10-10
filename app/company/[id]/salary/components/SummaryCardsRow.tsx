import { SummaryCard } from "./SummaryCard";
import {
  IconCompanyBurden,
  IconMinusCircle,
  IconMoney,
  IconNetPay,
  IconTotalLaborCost,
} from "./icons";
import type { IncomeSummary } from "@/types/company/salary";

interface SummaryCardsRowProps {
  summary: IncomeSummary;
  toCurrency: (value: number) => string;
}

export function SummaryCardsRow({ summary, toCurrency }: SummaryCardsRowProps) {
  const hasCompanyBurden = summary.companyBurden != null;
  const totalLaborCost = hasCompanyBurden
    ? summary.totalPayment + summary.companyBurden!
    : null;

  return (
    <div
      className={`mb-6 grid grid-cols-1 gap-2 ${
        hasCompanyBurden ? "sm:grid-cols-5" : "sm:grid-cols-3"
      }`}
    >
      <SummaryCard
        label="총 지급액"
        value={toCurrency(summary.totalPayment)}
        color="blue"
        icon={<IconMoney />}
      />
      <SummaryCard
        label="총 공제액"
        value={toCurrency(summary.totalDeduction)}
        color="rose"
        icon={<IconMinusCircle />}
      />
      <SummaryCard
        label="차인지급액"
        value={toCurrency(summary.netPayment)}
        color="emerald"
        icon={<IconNetPay />}
      />
      {hasCompanyBurden && (
        <SummaryCard
          label="회사 부담액"
          value={toCurrency(summary.companyBurden!)}
          color="orange"
          icon={<IconCompanyBurden />}
        />
      )}
      {totalLaborCost != null && (
        <SummaryCard
          label="총 인건비"
          value={toCurrency(totalLaborCost)}
          color="purple"
          icon={<IconTotalLaborCost />}
        />
      )}
    </div>
  );
}
