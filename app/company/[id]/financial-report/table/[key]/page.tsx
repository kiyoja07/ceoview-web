"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PivotTableDetailView } from "@/app/company/_components/financial-report/PivotTableDetailView";

function PivotTableDetailInner() {
  const { id, key } = useParams<{ id: string; key: string }>();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const reportQuery = reportId
    ? `?reportId=${encodeURIComponent(reportId)}`
    : "";

  return (
    <PivotTableDetailView
      statsUrl={`/api/company/${id}/financial-report-stats`}
      backHref={`/company/${id}/financial-report${reportQuery}`}
      pivotKey={key}
    />
  );
}

export default function PivotTableDetailPage() {
  return (
    <Suspense fallback={null}>
      <PivotTableDetailInner />
    </Suspense>
  );
}
