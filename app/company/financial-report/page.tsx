"use client";

import { Suspense } from "react";
import { FinancialReportView } from "@/app/company/_components/financial-report/FinancialReportView";

export default function CompanyFinancialReportPage() {
  return (
    <Suspense fallback={null}>
      <FinancialReportView
        statsUrl="/api/company/financial-report-stats"
        tableHrefBase="/company/financial-report/table"
      />
    </Suspense>
  );
}
