"use client";

import { useCallback, useEffect, useState } from "react";
import {
  display,
  getStatusColor,
} from "@/app/lib/employee-display";
import {
  formatResidentNumber,
  maskResidentNumber,
} from "@/app/lib/formatters";
import type { PendingRequestSummary } from "@/types/company/change-request";
import AddressInput, { type AddressValue } from "./AddressInput";
import BankAccountInput from "./BankAccountInput";
import ResidentNumberInput, {
  validateResidentNumber,
} from "./ResidentNumberInput";
import EmailInput, { validateEmail } from "./EmailInput";
import PhoneInput, { validatePhone } from "./PhoneInput";
import DateInput, { validateDate } from "./DateInput";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type EmployeeFullDetail = {
  id: string;
  incomeType?: string;
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  nationalityType: string | null;
  jobCategory: string | null;
  residenceType: string | null;
  department: string | null;
  positionTitle: string | null;
  email: string | null;
  phone: string | null;
  landlinePhone: string | null;
  hireDate: string | null;
  resignDate: string | null;
  status: string | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  hasSpouse: string | null;
  dependentUnder20: string | null;
  dependentOver60: string | null;
  deductionSenior: string | null;
  deductionDisabled: string | null;
  deductionWomen: string | null;
  deductionChildren: string | null;
  deductionBirthAdoption: string | null;
  deductionSingleParent: string | null;
  employmentInsurance: string | null;
  payGrade: string | null;
  nationalPension: string | null;
  healthInsurance: string | null;
  bankAccounts: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  createdAt: string;
  updatedAt: string;
  pendingRequest?: PendingRequestSummary | null;
  // 사업소득 고유 필드
  incomeCategory?: string | null;
  businessName?: string | null;
  businessRegistrationNumber?: string | null;
  businessAddress?: string | null;
  // 기타소득 고유 필드
  personType?: string | null;
  // 일용소득 고유 필드
  laborJobCategory?: string | null;
  payType?: string | null;
  paymentMethod?: string | null;
  overtimeType?: string | null;
  normalPay?: string | null;
  overtimePay?: string | null;
  siteName?: string | null;
  // 일용소득 인라인 계좌
  bankName?: string | null;
  accountNumber?: string | null;
};

type EmployeeDetailModalProps = {
  open: boolean;
  onClose: () => void;
  employeeId: string | null;
  fetchDetail: (id: string) => Promise<EmployeeFullDetail>;
  updateDetail?: (
    id: string,
    data: Record<string, unknown>,
  ) => Promise<EmployeeFullDetail>;
  theme?: "emerald" | "blue";
};

const themeColors = {
  emerald: {
    focus: "focus:border-emerald-500 focus:ring-emerald-500",
    button: "bg-emerald-600 hover:bg-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
  },
  blue: {
    focus: "focus:border-blue-500 focus:ring-blue-500",
    button: "bg-blue-600 hover:bg-blue-700",
    badge: "bg-blue-50 text-blue-700",
  },
};

// ────────────────────────────────────────────────────────────
// Field row component for view mode
// ────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function EmployeeDetailModal({
  open,
  onClose,
  employeeId,
  fetchDetail,
  updateDetail,
  theme = "emerald",
}: EmployeeDetailModalProps) {
  const colors = themeColors[theme];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeFullDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [showResidentNumber, setShowResidentNumber] = useState(false);

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  }, []);

  // Fetch detail when opened
  useEffect(() => {
    if (!open || !employeeId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setEditing(false);
    setShowResidentNumber(false);

    fetchDetail(employeeId)
      .then((data) => {
        if (cancelled) return;
        setEmployee(data);
        populateForm(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "직원 정보 조회에 실패했습니다.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, employeeId, fetchDetail, populateForm]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleStartEdit = () => {
    if (employee) populateForm(employee);
    setSubmitError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!updateDetail || !employeeId) return;

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
      const updated = await updateDetail(employeeId, {
        employeeCode: formEmployeeCode.trim() || null,
        name: formName.trim(),
        residentNumber: formResidentNumber.trim() || null,
        nationalityType: formNationalityType.trim() || null,
        jobCategory: formJobCategory.trim() || null,
        residenceType: formResidenceType.trim() || null,
        department: formDepartment.trim() || null,
        positionTitle: formPositionTitle.trim() || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        landlinePhone: formLandlinePhone.trim() || null,
        hireDate: formHireDate.trim() || null,
        resignDate: formResignDate.trim() || null,
        zipcode: formAddress.zipcode.trim() || null,
        address: formAddress.address.trim() || null,
        addressDetail: formAddress.addressDetail.trim() || null,
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
        payGrade: formPayGrade.trim() || null,
        nationalPension: formNationalPension.trim() || null,
        healthInsurance: formHealthInsurance.trim() || null,
        bankAccounts: formBankAccounts,
      });
      setEmployee(updated);
      setEditing(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "수정에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──

  const renderViewMode = () => {
    if (!employee) return null;

    return (
      <div
        className="space-y-6 overflow-y-auto px-6 pb-6"
        style={{ maxHeight: "calc(90vh - 80px)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              {employee.status && (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(employee.status)}`}
                >
                  {employee.status}
                </span>
              )}
              {employee.employeeCode && (
                <span className="font-mono text-xs text-gray-500">
                  {employee.employeeCode}
                </span>
              )}
            </div>
          </div>
          {updateDetail && (
            <button
              type="button"
              onClick={handleStartEdit}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition ${colors.button}`}
            >
              수정
            </button>
          )}
        </div>

        {/* 기본 정보 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            기본 정보
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="사원코드" value={display(employee.employeeCode)} />
            <Field label="이름" value={display(employee.name)} />
            <div>
              <dt className="text-xs font-medium text-gray-500">
                주민등록번호
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
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
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showResidentNumber ? "숨기기" : "보기"}
                  </button>
                )}
              </dd>
            </div>
            <Field
              label="내·외국인"
              value={display(employee.nationalityType)}
            />
            <Field label="직종구분" value={display(employee.jobCategory)} />
            <Field label="거주구분" value={display(employee.residenceType)} />
            <Field label="부서" value={display(employee.department)} />
            <Field label="직책" value={display(employee.positionTitle)} />
          </dl>
        </section>

        {/* 연락처 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">연락처</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="이메일" value={display(employee.email)} />
            <Field label="휴대폰" value={display(employee.phone)} />
            <Field label="전화번호" value={display(employee.landlinePhone)} />
          </dl>
        </section>

        {/* 주소 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">주소</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="우편번호" value={display(employee.zipcode)} />
            <Field label="주소" value={display(employee.address)} />
            <Field label="상세주소" value={display(employee.addressDetail)} />
          </dl>
        </section>

        {/* 입·퇴사 / 급여 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            입·퇴사 / 급여
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="입사일" value={display(employee.hireDate)} />
            <Field label="퇴사일" value={display(employee.resignDate)} />
            <Field label="호봉" value={display(employee.payGrade)} />
          </dl>
        </section>

        {/* 부양가족 / 소득공제 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            부양가족 / 소득공제
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="배우자 유무" value={display(employee.hasSpouse)} />
            <Field
              label="부양가족 20세이하"
              value={display(employee.dependentUnder20)}
            />
            <Field
              label="부양가족 60세이상"
              value={display(employee.dependentOver60)}
            />
            <Field label="경로우대" value={display(employee.deductionSenior)} />
            <Field label="장애인" value={display(employee.deductionDisabled)} />
            <Field label="부녀자" value={display(employee.deductionWomen)} />
            <Field label="자녀" value={display(employee.deductionChildren)} />
            <Field
              label="출산·입양"
              value={display(employee.deductionBirthAdoption)}
            />
            <Field
              label="한부모"
              value={display(employee.deductionSingleParent)}
            />
          </dl>
        </section>

        {/* 4대보험 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">4대보험</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="국민연금" value={display(employee.nationalPension)} />
            <Field label="건강보험" value={display(employee.healthInsurance)} />
            <Field
              label="고용보험"
              value={display(employee.employmentInsurance)}
            />
          </dl>
        </section>

        {/* 급여 계좌 */}
        <section className="rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            급여 계좌
          </h3>
          {employee.bankAccounts.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 계좌가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {employee.bankAccounts.map((ba) => (
                <div
                  key={ba.id}
                  className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-200"
                >
                  <span className="font-medium text-gray-700">
                    {ba.bankName}
                  </span>
                  <span className="text-gray-600">{ba.accountNumber}</span>
                  <span className="text-gray-500">({ba.accountHolder})</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 메타 */}
        <div className="flex gap-4 text-xs text-gray-400">
          <span>
            등록: {new Date(employee.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <span>
            수정: {new Date(employee.updatedAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    );
  };

  const renderEditMode = () => {
    const inputClass = `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 ${colors.focus} focus:outline-none focus:ring-1`;

    return (
      <div
        className="space-y-5 overflow-y-auto px-6 pb-6"
        style={{ maxHeight: "calc(90vh - 80px)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">직원 정보 수정</h2>
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
                주민등록번호12222
              </label>
              <ResidentNumberInput
                value={formResidentNumber}
                onChange={setFormResidentNumber}
                disabled={submitting}
                theme={theme}
              />
            </div>
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
          </div>
        </section>

        {/* 주소 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">주소</h3>
          <AddressInput
            value={formAddress}
            onChange={setFormAddress}
            disabled={submitting}
            theme={theme}
          />
        </section>

        {/* 입·퇴사 / 급여 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            입·퇴사 / 급여
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
          </div>
        </section>

        {/* 부양가족 / 소득공제 */}
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
                onChange={(e) => setFormDeductionBirthAdoption(e.target.value)}
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

        {/* 4대보험 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">4대보험</h3>
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

        {/* 급여 계좌 */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <BankAccountInput
            value={formBankAccounts}
            onChange={setFormBankAccounts}
            disabled={submitting}
            theme={theme}
            maxCount={1}
          />
        </section>

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Modal top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "직원 정보 수정" : "직원 상세 정보"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-500">직원 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : editing ? (
          renderEditMode()
        ) : (
          renderViewMode()
        )}
      </div>
    </div>
  );
}
