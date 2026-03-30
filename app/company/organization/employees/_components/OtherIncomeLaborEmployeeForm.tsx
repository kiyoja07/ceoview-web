"use client";

import { useState } from "react";
import ResidentNumberInput, {
  validateResidentNumber,
} from "@/app/_components/ResidentNumberInput";
import EmailInput, { validateEmail } from "@/app/_components/EmailInput";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";
import DateInput, { validateDate } from "@/app/_components/DateInput";

type OtherIncomeLaborEmployeeFormData = {
  employeeCode: string;
  name: string;
  residentNumber: string;
  department: string;
  positionTitle: string;
  email: string;
  phone: string;
  hireDate: string;
  resignDate: string;
  address: string;
  bankName: string;
  accountNumber: string;
};

type OtherIncomeLaborEmployeeFormProps = {
  initialData?: Partial<OtherIncomeLaborEmployeeFormData>;
  onSubmit: (data: OtherIncomeLaborEmployeeFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
};

export function OtherIncomeLaborEmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: OtherIncomeLaborEmployeeFormProps) {
  const [employeeCode, setEmployeeCode] = useState(
    initialData?.employeeCode ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [residentNumber, setResidentNumber] = useState(
    initialData?.residentNumber ?? "",
  );
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [positionTitle, setPositionTitle] = useState(
    initialData?.positionTitle ?? "",
  );
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [hireDate, setHireDate] = useState(initialData?.hireDate ?? "");
  const [resignDate, setResignDate] = useState(initialData?.resignDate ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initialData?.accountNumber ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    const residentError = validateResidentNumber(residentNumber);
    if (residentError) {
      setError(residentError);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const hireDateError = validateDate(hireDate);
    if (hireDateError) {
      setError(hireDateError);
      return;
    }

    const resignDateError = validateDate(resignDate);
    if (resignDateError) {
      setError(resignDateError);
      return;
    }

    if (hireDate && resignDate && hireDate > resignDate) {
      setError("입사일은 퇴사일보다 이후일 수 없습니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        employeeCode: employeeCode.trim(),
        name: name.trim(),
        residentNumber: residentNumber.trim(),
        department: department.trim(),
        positionTitle: positionTitle.trim(),
        email: email.trim(),
        phone: phone.trim(),
        hireDate: hireDate.trim(),
        resignDate: resignDate.trim(),
        address: address.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          기본 정보
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="oil-emp-code"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              사원코드
            </label>
            <input
              id="oil-emp-code"
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP001"
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-name"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="oil-emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-resident"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              주민등록번호
            </label>
            <ResidentNumberInput
              id="oil-emp-resident"
              value={residentNumber}
              onChange={setResidentNumber}
              disabled={submitting}
              theme="emerald"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">연락처</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="oil-emp-email"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이메일
            </label>
            <EmailInput
              id="oil-emp-email"
              value={email}
              onChange={setEmail}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-phone"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              휴대폰번호
            </label>
            <PhoneInput
              id="oil-emp-phone"
              value={phone}
              onChange={setPhone}
              disabled={submitting}
              theme="emerald"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          소속·입퇴사
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="oil-emp-dept"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              부서
            </label>
            <input
              id="oil-emp-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-position"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              직책
            </label>
            <input
              id="oil-emp-position"
              type="text"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-hire"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              입사일
            </label>
            <DateInput
              id="oil-emp-hire"
              value={hireDate}
              onChange={setHireDate}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-resign"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              퇴사일
            </label>
            <DateInput
              id="oil-emp-resign"
              value={resignDate}
              onChange={setResignDate}
              disabled={submitting}
              theme="emerald"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          주소·계좌
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="oil-emp-address"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              주소
            </label>
            <input
              id="oil-emp-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-bank"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              은행명
            </label>
            <input
              id="oil-emp-bank"
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="oil-emp-account"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              계좌번호
            </label>
            <input
              id="oil-emp-account"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

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
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "처리 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
