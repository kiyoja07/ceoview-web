import type { PendingRequestSummary } from "@/types/company/change-request";
import {
  type EmployeeIncomeType,
} from "@/types/company/employees";
import {
  EMPLOYEE_INCOME_TYPE_LABELS,
  EMPLOYEE_INCOME_TYPE_TONE_CLASSES,
  EMPLOYEE_STATUS_TONE_CLASSES,
  getEmployeePendingRequestLabel,
} from "@/catalogs/ko/employee";

export function formatDate(value: string | null) {
  return value || "-";
}

export function getBirthDate(residentNumber: string | null) {
  if (!residentNumber) return "-";

  const digits = residentNumber.replace(/\D/g, "");
  if (digits.length < 6) return "-";

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
}

export function getStatusTone(status: string | null) {
  return status && status in EMPLOYEE_STATUS_TONE_CLASSES
    ? EMPLOYEE_STATUS_TONE_CLASSES[status as keyof typeof EMPLOYEE_STATUS_TONE_CLASSES]
    : EMPLOYEE_STATUS_TONE_CLASSES.UNKNOWN;
}

export function getIncomeTypeTone(incomeType: EmployeeIncomeType) {
  return EMPLOYEE_INCOME_TYPE_TONE_CLASSES[incomeType];
}

export function getPendingRequestLabel(request: PendingRequestSummary | null) {
  return getEmployeePendingRequestLabel(request);
}

export function resolvePendingIncomeType(request: PendingRequestSummary) {
  const payload = request.requestedPayload as {
    incomeType?: EmployeeIncomeType;
  };
  const incomeType =
    payload.incomeType && payload.incomeType in EMPLOYEE_INCOME_TYPE_LABELS
      ? payload.incomeType
      : "EARNED_INCOME";

  return EMPLOYEE_INCOME_TYPE_LABELS[incomeType];
}
