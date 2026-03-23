"use client";

import { useState } from "react";
import AddressInput from "@/app/_components/AddressInput";
import BankAccountInput from "@/app/_components/BankAccountInput";
import ResidentNumberInput, {
  validateResidentNumber,
} from "@/app/_components/ResidentNumberInput";
import EmailInput, { validateEmail } from "@/app/_components/EmailInput";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";
import DateInput, { validateDate } from "@/app/_components/DateInput";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import { colors, theme, populateFormFromEmployee } from "./helpers";

type Props = {
  employee: EmployeeFullDetail;
  companyId: string;
  employeeId: string;
  requestId?: string | null;
  onSave: (updated: EmployeeFullDetail) => void;
  onCancel: () => void;
  onAuthError: (status: number) => boolean;
};

export default function EmployeeEditMode({
  employee,
  companyId,
  employeeId,
  requestId,
  onSave,
  onCancel,
  onAuthError,
}: Props) {
  const initial = populateFormFromEmployee(employee);

  const [formEmployeeCode, setFormEmployeeCode] = useState(
    initial.formEmployeeCode,
  );
  const [formName, setFormName] = useState(initial.formName);
  const [formResidentNumber, setFormResidentNumber] = useState(
    initial.formResidentNumber,
  );
  const [formNationalityType, setFormNationalityType] = useState(
    initial.formNationalityType,
  );
  const [formJobCategory, setFormJobCategory] = useState(
    initial.formJobCategory,
  );
  const [formResidenceType, setFormResidenceType] = useState(
    initial.formResidenceType,
  );
  const [formDepartment, setFormDepartment] = useState(initial.formDepartment);
  const [formPositionTitle, setFormPositionTitle] = useState(
    initial.formPositionTitle,
  );
  const [formEmail, setFormEmail] = useState(initial.formEmail);
  const [formPhone, setFormPhone] = useState(initial.formPhone);
  const [formLandlinePhone, setFormLandlinePhone] = useState(
    initial.formLandlinePhone,
  );
  const [formHireDate, setFormHireDate] = useState(initial.formHireDate);
  const [formResignDate, setFormResignDate] = useState(initial.formResignDate);
  const [formAddress, setFormAddress] = useState(initial.formAddress);
  const [formHasSpouse, setFormHasSpouse] = useState(initial.formHasSpouse);
  const [formDependentUnder20, setFormDependentUnder20] = useState(
    initial.formDependentUnder20,
  );
  const [formDependentOver60, setFormDependentOver60] = useState(
    initial.formDependentOver60,
  );
  const [formDeductionSenior, setFormDeductionSenior] = useState(
    initial.formDeductionSenior,
  );
  const [formDeductionDisabled, setFormDeductionDisabled] = useState(
    initial.formDeductionDisabled,
  );
  const [formDeductionWomen, setFormDeductionWomen] = useState(
    initial.formDeductionWomen,
  );
  const [formDeductionChildren, setFormDeductionChildren] = useState(
    initial.formDeductionChildren,
  );
  const [formDeductionBirthAdoption, setFormDeductionBirthAdoption] = useState(
    initial.formDeductionBirthAdoption,
  );
  const [formDeductionSingleParent, setFormDeductionSingleParent] = useState(
    initial.formDeductionSingleParent,
  );
  const [formEmploymentInsurance, setFormEmploymentInsurance] = useState(
    initial.formEmploymentInsurance,
  );
  const [formPayGrade, setFormPayGrade] = useState(initial.formPayGrade);
  const [formNationalPension, setFormNationalPension] = useState(
    initial.formNationalPension,
  );
  const [formHealthInsurance, setFormHealthInsurance] = useState(
    initial.formHealthInsurance,
  );
  const [formBankAccounts, setFormBankAccounts] = useState(
    initial.formBankAccounts,
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
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
      const res = await fetch(
        `/api/agent/company/${companyId}/employee/${employeeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
            requestId,
          }),
        },
      );
      if (onAuthError(res.status)) return;
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error || "직원 정보 수정에 실패했습니다.");
      onSave(body as EmployeeFullDetail);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "수정에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 ${colors.focus} focus:outline-none focus:ring-1`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">직원 정보 수정</h2>
      </div>

      {/* 기본 정보 */}
      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">기본 정보</h3>
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
          onClick={onCancel}
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
}
