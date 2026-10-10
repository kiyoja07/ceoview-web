"use client";

import { useState } from "react";
import { MonthlyStatsChart } from "@/app/company/[id]/salary/components/MonthlyStatsChart";
import type { MonthlyStat } from "@/types/company/salary";

export default function ShowcaseMonthlyStatsChart({
  stats,
}: {
  stats: MonthlyStat[];
}) {
  const [months, setMonths] = useState(12);

  return (
    <MonthlyStatsChart
      stats={stats}
      months={months}
      onMonthsChange={setMonths}
    />
  );
}
