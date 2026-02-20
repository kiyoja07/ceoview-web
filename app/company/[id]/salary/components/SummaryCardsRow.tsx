import { SummaryCard } from "./SummaryCard";
import { IconMinusCircle, IconMoney, IconNetPay } from "./icons";
import type { IncomeSummary } from "../types";

interface SummaryCardsRowProps {
  summary: IncomeSummary;
  toCurrency: (value: number) => string;
}

export function SummaryCardsRow({ summary, toCurrency }: SummaryCardsRowProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  );
}
