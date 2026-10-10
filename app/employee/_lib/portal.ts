import { redirect } from "next/navigation";
import { backendGet } from "@/app/lib/backend";
import type { EmployeeAuthMeResponse } from "@/types/employee/auth";
import type { EmployeePayslipCollection } from "@/types/employee/payslips";

const EMPLOYEE_LOGIN_PATH = "/employee/auth/login";

async function getOrRedirect<T>(path: string): Promise<T> {
  const result = await backendGet<T>(path);
  if (result.ok) return result.data;
  if (result.status === 401) redirect(EMPLOYEE_LOGIN_PATH);
  throw new Error(`직원 정보를 불러오지 못했습니다. (${result.status})`);
}

// 로그인한 직원 본인 정보. 로그인하지 않았거나 비활성 계정이면 로그인 화면으로 보낸다.
export function getEmployeePortalUser() {
  return getOrRedirect<EmployeeAuthMeResponse>("/api/employee/auth/me");
}

// 로그인한 직원 본인의 공개된 급여명세서 목록.
export function getEmployeePayslipCollection() {
  return getOrRedirect<EmployeePayslipCollection>("/api/employee/payslips");
}
