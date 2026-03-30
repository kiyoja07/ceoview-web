"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";
import BankAccountInput from "@/app/_components/BankAccountInput";
import ResidentNumberInput, {
  validateResidentNumber,
} from "@/app/_components/ResidentNumberInput";
import EmailInput, { validateEmail } from "@/app/_components/EmailInput";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";
import DateInput, { validateDate } from "@/app/_components/DateInput";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import type {
  CompanyMutationRequestResponse,
  PendingRequestSummary,
} from "@/types/company/change-request";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function display(value: string | null | undefined): string {
  return value?.trim() || "-";
}

function maskResidentNumber(value: string | null): string {
  if (!value) return "-";
  const cleaned = value.replace(/[^0-9*]/g, "");
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 7)}******`;
  }
  return value;
}

function formatResidentNumber(value: string): string {
  const cleaned = value.replace(/[^0-9]/g, "");
  if (cleaned.length > 6) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case "재직중":
      return "text-emerald-600 bg-emerald-50";
    case "입사예정":
      return "text-blue-600 bg-blue-50";
    case "퇴사완료":
      return "text-gray-500 bg-gray-100";
    case "퇴사예정":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-400 bg-gray-50";
  }
}

function displayYesNo(value: string | null | undefined): string {
  const v = value?.trim();
  if (!v) return "-";
  if (v === "0") return "해당안됨";
  if (v === "1") return "해당함";
  return v;
}

function displayInsurance(value: string | null | undefined): string {
  const v = value?.trim();
  if (!v) return "-";
  if (v === "0" || v === "부") return "해당안됨";
  if (v === "1" || v === "여") return "가입";
  return v;
}

function Field({ label, value }: { label: string; value: string }) {
  const isEmpty = value === "-";
  return (
    <div className="rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-gray-100">
      <dt className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-medium ${isEmpty ? "text-gray-300" : "text-gray-800"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-gray-800">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      {title}
    </h3>
  );
}

const theme = "emerald" as const;
const colors = {
  focus: "focus:border-emerald-500 focus:ring-emerald-500",
  button: "bg-emerald-600 hover:bg-emerald-700",
  badge: "bg-emerald-50 text-emerald-700",
};

/* ── SVG icon helpers (14×14) ── */
const icons = {
  user: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  phone: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),
  map: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  calendar: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  family: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  shield: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  bank: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  ),
  briefcase: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2"
      />
    </svg>
  ),
};

function incomeTypeLabel(type: string | undefined): string {
  switch (type) {
    case "EARNED_INCOME":
      return "근로소득";
    case "BUSINESS_INCOME":
      return "사업소득";
    case "OTHER_INCOME":
      return "기타소득";
    case "OTHER_INCOME_LABOR":
      return "일용소득";
    default:
      return "근로소득";
  }
}

function isEarnedIncome(type: string | undefined): boolean {
  return !type || type === "EARNED_INCOME";
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = params?.id;
  const incomeType = searchParams?.get("incomeType") ?? "EARNED_INCOME";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeFullDetail | null>(null);
  const [pendingRequest, setPendingRequest] =
    useState<PendingRequestSummary | null>(null);
  const [editing, setEditing] = useState(false);
  const [showResidentNumber, setShowResidentNumber] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit form state
  const [formEmployeeCode, setFormEmployeeCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formResidentNumber, setFormResidentNumber] = useState("");
  const [formNationalityType, setFormNationalityType] = useState("");
  const [formJobCategory, setFormJobCategory] = useState("");
  const [formResidenceType, setFormResidenceType] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPositionTitle, setFormPositionTitle] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLandlinePhone, setFormLandlinePhone] = useState("");
  const [formHireDate, setFormHireDate] = useState("");
  const [formResignDate, setFormResignDate] = useState("");
  const [formAddress, setFormAddress] = useState<AddressValue>({
    zipcode: "",
    address: "",
    addressDetail: "",
  });
  const [formHasSpouse, setFormHasSpouse] = useState("");
  const [formDependentUnder20, setFormDependentUnder20] = useState("");
  const [formDependentOver60, setFormDependentOver60] = useState("");
  const [formDeductionSenior, setFormDeductionSenior] = useState("");
  const [formDeductionDisabled, setFormDeductionDisabled] = useState("");
  const [formDeductionWomen, setFormDeductionWomen] = useState("");
  const [formDeductionChildren, setFormDeductionChildren] = useState("");
  const [formDeductionBirthAdoption, setFormDeductionBirthAdoption] =
    useState("");
  const [formDeductionSingleParent, setFormDeductionSingleParent] =
    useState("");
  const [formEmploymentInsurance, setFormEmploymentInsurance] = useState("");
  const [formPayGrade, setFormPayGrade] = useState("");
  const [formNationalPension, setFormNationalPension] = useState("");
  const [formHealthInsurance, setFormHealthInsurance] = useState("");
  const [formBankAccounts, setFormBankAccounts] = useState<
    {
      id?: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }[]
  >([]);
  // Income-type-specific form state
  const [formIncomeCategory, setFormIncomeCategory] = useState("");
  const [formBusinessName, setFormBusinessName] = useState("");
  const [formBusinessRegistrationNumber, setFormBusinessRegistrationNumber] =
    useState("");
  const [formBusinessAddress, setFormBusinessAddress] = useState("");
  const [formPersonType, setFormPersonType] = useState("");
  const [formLaborJobCategory, setFormLaborJobCategory] = useState("");
  const [formPayType, setFormPayType] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("");
  const [formOvertimeType, setFormOvertimeType] = useState("");
  const [formNormalPay, setFormNormalPay] = useState("");
  const [formOvertimePay, setFormOvertimePay] = useState("");
  const [formSiteName, setFormSiteName] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAuthError = useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/company/auth/login");
        return true;
      }
      return false;
    },
    [router],
  );

  const populateForm = useCallback((emp: EmployeeFullDetail) => {
    setFormEmployeeCode(emp.employeeCode ?? "");
    setFormName(emp.name);
    setFormResidentNumber(emp.residentNumber ?? "");
    setFormNationalityType(emp.nationalityType ?? "");
    setFormJobCategory(emp.jobCategory ?? "");
    setFormResidenceType(emp.residenceType ?? "");
    setFormDepartment(emp.department ?? "");
    setFormPositionTitle(emp.positionTitle ?? "");
    setFormEmail(emp.email ?? "");
    setFormPhone(emp.phone && emp.phone.replace(/\D/g, "") ? emp.phone : "");
    setFormLandlinePhone(
      emp.landlinePhone && emp.landlinePhone.replace(/\D/g, "")
        ? emp.landlinePhone
        : "",
    );
    setFormHireDate(emp.hireDate ?? "");
    setFormResignDate(emp.resignDate ?? "");
    setFormAddress({
      zipcode: emp.zipcode ?? "",
      address: emp.address ?? "",
      addressDetail: emp.addressDetail ?? "",
    });
    setFormHasSpouse(emp.hasSpouse ?? "");
    setFormDependentUnder20(emp.dependentUnder20 ?? "");
    setFormDependentOver60(emp.dependentOver60 ?? "");
    setFormDeductionSenior(emp.deductionSenior ?? "");
    setFormDeductionDisabled(emp.deductionDisabled ?? "");
    setFormDeductionWomen(emp.deductionWomen ?? "");
    setFormDeductionChildren(emp.deductionChildren ?? "");
    setFormDeductionBirthAdoption(emp.deductionBirthAdoption ?? "");
    setFormDeductionSingleParent(emp.deductionSingleParent ?? "");
    setFormEmploymentInsurance(emp.employmentInsurance ?? "");
    setFormPayGrade(emp.payGrade ?? "");
    setFormNationalPension(emp.nationalPension ?? "");
    setFormHealthInsurance(emp.healthInsurance ?? "");
    setFormBankAccounts(
      emp.bankAccounts.map((ba) => ({
        id: ba.id,
        bankName: ba.bankName,
        accountNumber: ba.accountNumber,
        accountHolder: ba.accountHolder,
      })),
    );
    // Income-type-specific fields
    setFormIncomeCategory(emp.incomeCategory ?? "");
    setFormBusinessName(emp.businessName ?? "");
    setFormBusinessRegistrationNumber(emp.businessRegistrationNumber ?? "");
    setFormBusinessAddress(emp.businessAddress ?? "");
    setFormPersonType(emp.personType ?? "");
    setFormLaborJobCategory(emp.laborJobCategory ?? "");
    setFormPayType(emp.payType ?? "");
    setFormPaymentMethod(emp.paymentMethod ?? "");
    setFormOvertimeType(emp.overtimeType ?? "");
    setFormNormalPay(emp.normalPay ?? "");
    setFormOvertimePay(emp.overtimePay ?? "");
    setFormSiteName(emp.siteName ?? "");
    setFormBankName(emp.bankName ?? "");
    setFormAccountNumber(emp.accountNumber ?? "");
  }, []);

  // Fetch detail on mount
  useEffect(() => {
    if (!employeeId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const meRes = await fetch("/api/company/auth/me", {
          cache: "no-store",
        });
        if (handleAuthError(meRes.status)) return;
        if (meRes.ok) {
          const me = (await meRes.json()) as { profileComplete?: boolean };
          if (!me.profileComplete) {
            router.replace("/company/auth/onboarding");
            return;
          }
        }

        const res = await fetch(
          `/api/company/employees/${employeeId}?incomeType=${incomeType}`,
          {
            cache: "no-store",
          },
        );
        if (handleAuthError(res.status)) return;
        const body = await res.json();
        if (!res.ok)
          throw new Error(body?.error || "직원 정보 조회에 실패했습니다.");
        if (cancelled) return;
        const data = body as EmployeeFullDetail;
        setEmployee(data);
        setPendingRequest(data.pendingRequest ?? null);
        populateForm(data);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "직원 정보 조회에 실패했습니다.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId, incomeType, handleAuthError, populateForm, router]);

  // ── Delete employee ──
  const handleDelete = async () => {
    if (!employeeId) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(
        `/api/company/employees/${employeeId}?incomeType=${incomeType}`,
        {
          method: "DELETE",
        },
      );
      if (handleAuthError(res.status)) return;
      const data = (await res.json().catch(() => null)) as
        | CompanyMutationRequestResponse
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          (data && "error" in data ? data.error : undefined) ||
            "삭제에 실패했습니다.",
        );
      }
      if (!data || !("request" in data) || !data.request) {
        throw new Error("삭제 요청 결과를 확인하지 못했습니다.");
      }
      setPendingRequest(data.request);
      setDeleteConfirmOpen(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "삭제에 실패했습니다.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleStartEdit = () => {
    if (pendingRequest) return;
    if (employee) populateForm(employee);
    setSubmitError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!employeeId) return;

    if (!formName.trim()) {
      setSubmitError("이름을 입력해주세요.");
      return;
    }
    if (formResidentNumber) {
      const err = validateResidentNumber(formResidentNumber);
      if (err) {
        setSubmitError(err);
        return;
      }
    }
    if (formEmail) {
      const err = validateEmail(formEmail);
      if (err) {
        setSubmitError(err);
        return;
      }
    }
    if (formPhone) {
      const err = validatePhone(formPhone);
      if (err) {
        setSubmitError(err);
        return;
      }
    }
    if (formHireDate) {
      const err = validateDate(formHireDate);
      if (err) {
        setSubmitError(err);
        return;
      }
    }
    if (formResignDate) {
      const err = validateDate(formResignDate);
      if (err) {
        setSubmitError(err);
        return;
      }
    }
    if (formHireDate && formResignDate && formHireDate > formResignDate) {
      setSubmitError("입사일은 퇴사일보다 이후일 수 없습니다.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build payload per income type – only include fields that exist in the model
      const payload: Record<string, unknown> = {
        employeeCode: formEmployeeCode.trim() || null,
        name: formName.trim(),
        residentNumber: formResidentNumber.trim() || null,
        department: formDepartment.trim() || null,
        positionTitle: formPositionTitle.trim() || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        hireDate: formHireDate.trim() || null,
        resignDate: formResignDate.trim() || null,
      };

      if (isEarnedIncome(incomeType)) {
        // 근로소득 전용 필드
        Object.assign(payload, {
          nationalityType: formNationalityType.trim() || null,
          jobCategory: formJobCategory.trim() || null,
          residenceType: formResidenceType.trim() || null,
          landlinePhone: formLandlinePhone.trim() || null,
          zipcode: formAddress.zipcode.trim() || null,
          address: formAddress.address.trim() || null,
          addressDetail: formAddress.addressDetail.trim() || null,
          payGrade: formPayGrade.trim() || null,
          hasSpouse: formHasSpouse.trim() || null,
          dependentUnder20: formDependentUnder20.trim() || null,
          dependentOver60: formDependentOver60.trim() || null,
          deductionSenior: formDeductionSenior.trim() || null,
          deductionDisabled: formDeductionDisabled.trim() || null,
          deductionWomen: formDeductionWomen.trim() || null,
          deductionChildren: formDeductionChildren.trim() || null,
          deductionBirthAdoption: formDeductionBirthAdoption.trim() || null,
          deductionSingleParent: formDeductionSingleParent.trim() || null,
          employmentInsurance: formEmploymentInsurance.trim() || null,
          nationalPension: formNationalPension.trim() || null,
          healthInsurance: formHealthInsurance.trim() || null,
          bankAccounts: formBankAccounts,
        });
      } else if (incomeType === "BUSINESS_INCOME") {
        Object.assign(payload, {
          nationalityType: formNationalityType.trim() || null,
          residenceType: formResidenceType.trim() || null,
          zipcode: formAddress.zipcode.trim() || null,
          address: formAddress.address.trim() || null,
          incomeCategory: formIncomeCategory.trim() || null,
          businessName: formBusinessName.trim() || null,
          businessRegistrationNumber:
            formBusinessRegistrationNumber.trim() || null,
          businessAddress: formBusinessAddress.trim() || null,
        });
      } else if (incomeType === "OTHER_INCOME") {
        Object.assign(payload, {
          nationalityType: formNationalityType.trim() || null,
          residenceType: formResidenceType.trim() || null,
          zipcode: formAddress.zipcode.trim() || null,
          incomeCategory: formIncomeCategory.trim() || null,
          personType: formPersonType.trim() || null,
          businessRegistrationNumber:
            formBusinessRegistrationNumber.trim() || null,
          businessAddress: formBusinessAddress.trim() || null,
        });
      } else if (incomeType === "OTHER_INCOME_LABOR") {
        Object.assign(payload, {
          address: formAddress.address.trim() || null,
          jobCategory: formLaborJobCategory.trim() || null,
          payType: formPayType.trim() || null,
          paymentMethod: formPaymentMethod.trim() || null,
          overtimeType: formOvertimeType.trim() || null,
          normalPay: formNormalPay.trim() || null,
          overtimePay: formOvertimePay.trim() || null,
          siteName: formSiteName.trim() || null,
          bankName: formBankName.trim() || null,
          accountNumber: formAccountNumber.trim() || null,
        });
      }

      const res = await fetch(
        `/api/company/employees/${employeeId}?incomeType=${incomeType}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (handleAuthError(res.status)) return;
      const body = (await res.json()) as
        | CompanyMutationRequestResponse
        | { error?: string };
      if (!res.ok)
        throw new Error(
          ("error" in body ? body.error : undefined) ||
            "직원 정보 수정에 실패했습니다.",
        );
      const result = body as CompanyMutationRequestResponse;
      setPendingRequest(result.request);
      setEditing(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "수정에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── View mode ──
  const renderViewMode = () => {
    if (!employee) return null;

    return (
      <div className="space-y-7">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-sm">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900">
                  {employee.name}
                </h2>
                {employee.incomeType && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    {incomeTypeLabel(employee.incomeType)}
                  </span>
                )}
                {employee.status && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(employee.status)}`}
                  >
                    {employee.status}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
                {employee.employeeCode && (
                  <span className="font-mono text-xs">
                    {employee.employeeCode}
                  </span>
                )}
                {employee.department && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{employee.department}</span>
                  </>
                )}
                {employee.positionTitle && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{employee.positionTitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={Boolean(pendingRequest)}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition ${colors.button}`}
            >
              {pendingRequest ? "검수 대기 중" : "수정"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={Boolean(pendingRequest)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        </div>

        {pendingRequest && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            현재 이 직원에 대한{" "}
            {pendingRequest.action === "DELETE" ? "삭제" : "수정"} 요청이 접수
            되었습니다.
            <div className="mt-1 text-xs text-amber-700">
              접수일시 {new Date(pendingRequest.createdAt).toLocaleString()}
            </div>
            <button
              type="button"
              onClick={() => router.push("/company/requests")}
              className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              요청 현황 보기
            </button>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* ── 기본 정보 ── */}
        <section>
          <SectionHeader icon={icons.user} title="기본 정보" />
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="이름" value={display(employee.name)} />
            <div className="rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-gray-100">
              <dt className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
                주민등록번호
              </dt>
              <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-800">
                <span>
                  {employee.residentNumber
                    ? showResidentNumber
                      ? formatResidentNumber(employee.residentNumber)
                      : maskResidentNumber(employee.residentNumber)
                    : "-"}
                </span>
                {employee.residentNumber && (
                  <button
                    type="button"
                    onClick={() => setShowResidentNumber((v) => !v)}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 transition hover:bg-emerald-50"
                  >
                    {showResidentNumber ? "숨기기" : "보기"}
                  </button>
                )}
              </dd>
            </div>
            {incomeType !== "OTHER_INCOME_LABOR" && (
              <Field
                label="내·외국인"
                value={display(employee.nationalityType)}
              />
            )}
            {isEarnedIncome(incomeType) && (
              <Field label="직종구분" value={display(employee.jobCategory)} />
            )}
            {incomeType !== "OTHER_INCOME_LABOR" && (
              <Field label="거주구분" value={display(employee.residenceType)} />
            )}
            <Field label="부서" value={display(employee.department)} />
            <Field label="직책" value={display(employee.positionTitle)} />
          </dl>
        </section>

        {/* ── 연락처 ── */}
        <section>
          <SectionHeader icon={icons.phone} title="연락처" />
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="이메일" value={display(employee.email)} />
            <Field label="휴대폰" value={display(employee.phone)} />
            {isEarnedIncome(incomeType) && (
              <Field label="전화번호" value={display(employee.landlinePhone)} />
            )}
          </dl>
        </section>

        {/* ── 주소 ── */}
        <section>
          <SectionHeader icon={icons.map} title="주소" />
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {(isEarnedIncome(incomeType) ||
              incomeType === "BUSINESS_INCOME" ||
              incomeType === "OTHER_INCOME") && (
              <Field label="우편번호" value={display(employee.zipcode)} />
            )}
            {incomeType !== "OTHER_INCOME" && (
              <Field label="주소" value={display(employee.address)} />
            )}
            {isEarnedIncome(incomeType) && (
              <Field label="상세주소" value={display(employee.addressDetail)} />
            )}
          </dl>
        </section>

        {/* ── 입·퇴사 / 급여 ── */}
        <section>
          <SectionHeader
            icon={icons.calendar}
            title={`입·퇴사${isEarnedIncome(incomeType) ? " / 급여" : ""}`}
          />
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="입사일" value={display(employee.hireDate)} />
            <Field label="퇴사일" value={display(employee.resignDate)} />
            {isEarnedIncome(incomeType) && (
              <Field label="호봉" value={display(employee.payGrade)} />
            )}
          </dl>
        </section>

        {/* ── 부양가족 / 소득공제 – 근로소득만 ── */}
        {isEarnedIncome(employee.incomeType) && (
          <section>
            <SectionHeader icon={icons.family} title="부양가족 / 소득공제" />
            <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="배우자 유무"
                value={displayYesNo(employee.hasSpouse)}
              />
              <Field
                label="부양가족 20세이하"
                value={displayYesNo(employee.dependentUnder20)}
              />
              <Field
                label="부양가족 60세이상"
                value={displayYesNo(employee.dependentOver60)}
              />
              <Field
                label="경로우대"
                value={displayYesNo(employee.deductionSenior)}
              />
              <Field
                label="장애인"
                value={displayYesNo(employee.deductionDisabled)}
              />
              <Field
                label="부녀자"
                value={displayYesNo(employee.deductionWomen)}
              />
              <Field
                label="자녀"
                value={displayYesNo(employee.deductionChildren)}
              />
              <Field
                label="출산·입양"
                value={displayYesNo(employee.deductionBirthAdoption)}
              />
              <Field
                label="한부모"
                value={displayYesNo(employee.deductionSingleParent)}
              />
            </dl>
          </section>
        )}

        {/* ── 4대보험 – 근로소득만 ── */}
        {isEarnedIncome(employee.incomeType) && (
          <section>
            <SectionHeader icon={icons.shield} title="4대보험" />
            <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="국민연금"
                value={displayInsurance(employee.nationalPension)}
              />
              <Field
                label="건강보험"
                value={displayInsurance(employee.healthInsurance)}
              />
              <Field
                label="고용보험"
                value={displayInsurance(employee.employmentInsurance)}
              />
            </dl>
          </section>
        )}

        {/* ── 사업소득 고유 정보 ── */}
        {employee.incomeType === "BUSINESS_INCOME" && (
          <section>
            <SectionHeader icon={icons.briefcase} title="사업소득 정보" />
            <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="소득구분"
                value={display(employee.incomeCategory)}
              />
              <Field label="상호" value={display(employee.businessName)} />
              <Field
                label="사업자등록번호"
                value={display(employee.businessRegistrationNumber)}
              />
              <Field
                label="사업장 주소"
                value={display(employee.businessAddress)}
              />
            </dl>
          </section>
        )}

        {/* ── 기타소득 고유 정보 ── */}
        {employee.incomeType === "OTHER_INCOME" && (
          <section>
            <SectionHeader icon={icons.briefcase} title="기타소득 정보" />
            <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="소득구분"
                value={display(employee.incomeCategory)}
              />
              <Field
                label="법인/개인 구분"
                value={display(employee.personType)}
              />
              <Field
                label="사업자등록번호"
                value={display(employee.businessRegistrationNumber)}
              />
              <Field
                label="사업장 주소"
                value={display(employee.businessAddress)}
              />
            </dl>
          </section>
        )}

        {/* ── 일용소득 고유 정보 ── */}
        {employee.incomeType === "OTHER_INCOME_LABOR" && (
          <section>
            <SectionHeader icon={icons.briefcase} title="일용소득 정보" />
            <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="직종" value={display(employee.laborJobCategory)} />
              <Field label="급여형태" value={display(employee.payType)} />
              <Field label="지급방법" value={display(employee.paymentMethod)} />
              <Field label="연장근로" value={display(employee.overtimeType)} />
              <Field label="통상임금" value={display(employee.normalPay)} />
              <Field
                label="연장근로수당"
                value={display(employee.overtimePay)}
              />
              <Field label="공사현장명" value={display(employee.siteName)} />
            </dl>
          </section>
        )}

        {/* ── 급여 계좌 – 근로소득 ── */}
        {isEarnedIncome(incomeType) && (
          <section>
            <SectionHeader icon={icons.bank} title="급여 계좌" />
            {employee.bankAccounts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
                <p className="text-sm text-gray-400">등록된 계좌가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employee.bankAccounts.map((ba) => (
                  <div
                    key={ba.id}
                    className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-100"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                      {ba.bankName.charAt(0)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{ba.bankName}</p>
                      <p className="font-mono text-xs text-gray-500">
                        {ba.accountNumber} · {ba.accountHolder}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 급여 계좌 – 일용소득 (인라인) ── */}
        {incomeType === "OTHER_INCOME_LABOR" && (
          <section>
            <SectionHeader icon={icons.bank} title="급여 계좌" />
            <dl className="grid gap-2.5 sm:grid-cols-2">
              <Field label="은행명" value={display(employee.bankName)} />
              <Field label="계좌번호" value={display(employee.accountNumber)} />
            </dl>
          </section>
        )}

        {/* ── 메타 ── */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-4 text-[11px] text-gray-400">
          <span>
            등록 {new Date(employee.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <span className="text-gray-200">·</span>
          <span>
            수정 {new Date(employee.updatedAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    );
  };

  // ── Edit mode ──
  const renderEditMode = () => {
    const inputClass = `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 ${colors.focus} focus:outline-none focus:ring-1`;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            지급 대상자 정보 수정
          </h2>
        </div>

        {/* 기본 정보 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            기본 정보
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                사원코드
              </label>
              <input
                type="text"
                value={formEmployeeCode}
                onChange={(e) => setFormEmployeeCode(e.target.value)}
                placeholder="EMP001"
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                주민등록번호
              </label>
              <ResidentNumberInput
                value={formResidentNumber}
                onChange={setFormResidentNumber}
                disabled={submitting}
                theme={theme}
              />
            </div>
            {incomeType !== "OTHER_INCOME_LABOR" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  내·외국인
                </label>
                <input
                  type="text"
                  value={formNationalityType}
                  onChange={(e) => setFormNationalityType(e.target.value)}
                  placeholder="내국인 / 외국인"
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
            {isEarnedIncome(incomeType) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  직종구분
                </label>
                <input
                  type="text"
                  value={formJobCategory}
                  onChange={(e) => setFormJobCategory(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
            {incomeType !== "OTHER_INCOME_LABOR" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  거주구분
                </label>
                <input
                  type="text"
                  value={formResidenceType}
                  onChange={(e) => setFormResidenceType(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                부서
              </label>
              <input
                type="text"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                직책
              </label>
              <input
                type="text"
                value={formPositionTitle}
                onChange={(e) => setFormPositionTitle(e.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </div>
          </div>
        </section>

        {/* 연락처 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">연락처</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                이메일
              </label>
              <EmailInput
                value={formEmail}
                onChange={setFormEmail}
                disabled={submitting}
                theme={theme}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                휴대폰
              </label>
              <PhoneInput
                value={formPhone}
                onChange={setFormPhone}
                disabled={submitting}
                theme={theme}
              />
            </div>
            {isEarnedIncome(incomeType) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  전화번호
                </label>
                <input
                  type="text"
                  value={formLandlinePhone}
                  onChange={(e) => {
                    const v = e.target.value;
                    const digits = v.replace(/\D/g, "");
                    setFormLandlinePhone(digits ? v : "");
                  }}
                  placeholder="02-1234-5678"
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
          </div>
        </section>

        {/* 주소 */}
        {isEarnedIncome(incomeType) ? (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">주소</h3>
            <AddressInput
              value={formAddress}
              onChange={setFormAddress}
              disabled={submitting}
              theme={theme}
            />
          </section>
        ) : (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">주소</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(incomeType === "BUSINESS_INCOME" ||
                incomeType === "OTHER_INCOME") && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    우편번호
                  </label>
                  <input
                    type="text"
                    value={formAddress.zipcode}
                    onChange={(e) =>
                      setFormAddress((prev) => ({
                        ...prev,
                        zipcode: e.target.value,
                      }))
                    }
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>
              )}
              {incomeType !== "OTHER_INCOME" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formAddress.address}
                    onChange={(e) =>
                      setFormAddress((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* 입·퇴사 / 급여 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            입·퇴사{isEarnedIncome(incomeType) ? " / 급여" : ""}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                입사일
              </label>
              <DateInput
                value={formHireDate}
                onChange={setFormHireDate}
                disabled={submitting}
                theme={theme}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                퇴사일
              </label>
              <DateInput
                value={formResignDate}
                onChange={setFormResignDate}
                disabled={submitting}
                theme={theme}
              />
            </div>
            {isEarnedIncome(incomeType) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  호봉
                </label>
                <input
                  type="text"
                  value={formPayGrade}
                  onChange={(e) => setFormPayGrade(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
          </div>
        </section>

        {/* 부양가족 / 소득공제 – 근로소득만 */}
        {isEarnedIncome(incomeType) && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              부양가족 / 소득공제
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  배우자 유무
                </label>
                <input
                  type="text"
                  value={formHasSpouse}
                  onChange={(e) => setFormHasSpouse(e.target.value)}
                  placeholder="유 / 무"
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  부양가족 20세이하
                </label>
                <input
                  type="text"
                  value={formDependentUnder20}
                  onChange={(e) => setFormDependentUnder20(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  부양가족 60세이상
                </label>
                <input
                  type="text"
                  value={formDependentOver60}
                  onChange={(e) => setFormDependentOver60(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  경로우대
                </label>
                <input
                  type="text"
                  value={formDeductionSenior}
                  onChange={(e) => setFormDeductionSenior(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  장애인
                </label>
                <input
                  type="text"
                  value={formDeductionDisabled}
                  onChange={(e) => setFormDeductionDisabled(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  부녀자
                </label>
                <input
                  type="text"
                  value={formDeductionWomen}
                  onChange={(e) => setFormDeductionWomen(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  자녀
                </label>
                <input
                  type="text"
                  value={formDeductionChildren}
                  onChange={(e) => setFormDeductionChildren(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  출산·입양
                </label>
                <input
                  type="text"
                  value={formDeductionBirthAdoption}
                  onChange={(e) =>
                    setFormDeductionBirthAdoption(e.target.value)
                  }
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  한부모
                </label>
                <input
                  type="text"
                  value={formDeductionSingleParent}
                  onChange={(e) => setFormDeductionSingleParent(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* 4대보험 – 근로소득만 */}
        {isEarnedIncome(incomeType) && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              4대보험
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  국민연금
                </label>
                <input
                  type="text"
                  value={formNationalPension}
                  onChange={(e) => setFormNationalPension(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  건강보험
                </label>
                <input
                  type="text"
                  value={formHealthInsurance}
                  onChange={(e) => setFormHealthInsurance(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  고용보험
                </label>
                <input
                  type="text"
                  value={formEmploymentInsurance}
                  onChange={(e) => setFormEmploymentInsurance(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* 사업소득 고유 정보 편집 */}
        {incomeType === "BUSINESS_INCOME" && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              사업소득 정보
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  소득구분
                </label>
                <input
                  type="text"
                  value={formIncomeCategory}
                  onChange={(e) => setFormIncomeCategory(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  상호
                </label>
                <input
                  type="text"
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={formBusinessRegistrationNumber}
                  onChange={(e) =>
                    setFormBusinessRegistrationNumber(e.target.value)
                  }
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  사업장 주소
                </label>
                <input
                  type="text"
                  value={formBusinessAddress}
                  onChange={(e) => setFormBusinessAddress(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* 기타소득 고유 정보 편집 */}
        {incomeType === "OTHER_INCOME" && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              기타소득 정보
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  소득구분
                </label>
                <input
                  type="text"
                  value={formIncomeCategory}
                  onChange={(e) => setFormIncomeCategory(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  법인/개인 구분
                </label>
                <input
                  type="text"
                  value={formPersonType}
                  onChange={(e) => setFormPersonType(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={formBusinessRegistrationNumber}
                  onChange={(e) =>
                    setFormBusinessRegistrationNumber(e.target.value)
                  }
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  사업장 주소
                </label>
                <input
                  type="text"
                  value={formBusinessAddress}
                  onChange={(e) => setFormBusinessAddress(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* 일용소득 고유 정보 편집 */}
        {incomeType === "OTHER_INCOME_LABOR" && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              일용소득 정보
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  직종
                </label>
                <input
                  type="text"
                  value={formLaborJobCategory}
                  onChange={(e) => setFormLaborJobCategory(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  급여형태
                </label>
                <input
                  type="text"
                  value={formPayType}
                  onChange={(e) => setFormPayType(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  지급방법
                </label>
                <input
                  type="text"
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  연장근로
                </label>
                <input
                  type="text"
                  value={formOvertimeType}
                  onChange={(e) => setFormOvertimeType(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  통상임금
                </label>
                <input
                  type="text"
                  value={formNormalPay}
                  onChange={(e) => setFormNormalPay(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  연장근로수당
                </label>
                <input
                  type="text"
                  value={formOvertimePay}
                  onChange={(e) => setFormOvertimePay(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  공사현장명
                </label>
                <input
                  type="text"
                  value={formSiteName}
                  onChange={(e) => setFormSiteName(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* 급여 계좌 – 근로소득 */}
        {isEarnedIncome(incomeType) && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <BankAccountInput
              value={formBankAccounts}
              onChange={setFormBankAccounts}
              disabled={submitting}
              theme={theme}
              maxCount={1}
            />
          </section>
        )}

        {/* 급여 계좌 – 일용소득 (인라인) */}
        {incomeType === "OTHER_INCOME_LABOR" && (
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              급여 계좌
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  은행명
                </label>
                <input
                  type="text"
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {submitError && (
          <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:opacity-50 ${colors.button}`}
          >
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ──
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {editing ? "직원 정보 수정" : "직원 상세 정보"}
          </h1>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-500">
                직원 정보를 불러오는 중...
              </p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : editing ? (
            renderEditMode()
          ) : (
            renderViewMode()
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setDeleteConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">직원 삭제</h3>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {employee?.name}
              </span>{" "}
              직원을 삭제하시겠습니까?
              <br />
              <span className="text-red-500">
                삭제된 데이터는 복구할 수 없습니다.
              </span>
            </p>

            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
