"use client";

import { SalaryDashboardView } from "@/app/company/_components/salary/SalaryDashboardView";

export default function SalaryDashboardPage() {
  return <SalaryDashboardView statsUrl="/api/company/salary-stats?months=60" />;
}
