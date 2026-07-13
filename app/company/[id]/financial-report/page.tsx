"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { FinancialReportView } from "@/app/company/_components/financial-report/FinancialReportView";

export default function CompanyFinancialReportPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <Suspense fallback={null}>
      <FinancialReportView
        statsUrl={`/api/company/${id}/financial-report-stats`}
        tableHrefBase={`/company/${id}/financial-report/table`}
      />
    </Suspense>
  );
}
