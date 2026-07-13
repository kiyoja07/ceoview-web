"use client";

import { useParams } from "next/navigation";
import { SalaryDashboardView } from "@/app/company/_components/salary/SalaryDashboardView";

export default function SalaryDashboardPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <SalaryDashboardView statsUrl={`/api/company/${id}/salary-stats?months=60`} />
  );
}
