"use client";

import { useState } from "react";
import type { EmployeeBankAccountBody } from "@/types/company/employees";
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

type EmployeeFormData = {
  employeeCode: string;
  name: string;
  residentNumber: string;
  email: string;
  phone: string;
  hireDate: string;
  resignDate: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  bankAccounts: EmployeeBankAccountBody[];
};

type EmployeeFormProps = {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
};

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: EmployeeFormProps) {
  const [employeeCode, setEmployeeCode] = useState(
    initialData?.employeeCode ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [residentNumber, setResidentNumber] = useState(
    initialData?.residentNumber ?? "",
  );
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [hireDate, setHireDate] = useState(initialData?.hireDate ?? "");
  const [resignDate, setResignDate] = useState(initialData?.resignDate ?? "");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: initialData?.zipcode ?? "",
    address: initialData?.address ?? "",
    addressDetail: initialData?.addressDetail ?? "",
  });
  const [bankAccounts, setBankAccounts] = useState<EmployeeBankAccountBody[]>(
    initialData?.bankAccounts ?? [],
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

    if (
      bankAccounts.length > 0 &&
      bankAccounts.some(
        (ba) =>
          !ba.bankName.trim() ||
          !ba.accountNumber.trim() ||
          !ba.accountHolder.trim(),
      )
    ) {
      setError("급여 계좌의 은행, 계좌번호, 예금주를 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        employeeCode: employeeCode.trim(),
        name: name.trim(),
        residentNumber: residentNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        hireDate: hireDate.trim(),
        resignDate: resignDate.trim(),
        zipcode: addressValue.zipcode.trim(),
        address: addressValue.address.trim(),
        addressDetail: addressValue.addressDetail.trim(),
        bankAccounts,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          기본 정보
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="emp-code"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              사원코드
            </label>
            <input
              id="emp-code"
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP001"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="emp-name"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="emp-resident"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              주민등록번호
            </label>
            <ResidentNumberInput
              id="emp-resident"
              value={residentNumber}
              onChange={setResidentNumber}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="emp-email"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이메일
            </label>
            <EmailInput
              id="emp-email"
              value={email}
              onChange={setEmail}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="emp-phone"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              휴대폰번호
            </label>
            <PhoneInput
              id="emp-phone"
              value={phone}
              onChange={setPhone}
              disabled={submitting}
              theme="emerald"
            />
          </div>
        </div>
        <div className="mt-4">
          <AddressInput
            value={addressValue}
            onChange={setAddressValue}
            disabled={submitting}
            theme="emerald"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          입·퇴사일
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="emp-hire-date"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              입사일
            </label>
            <DateInput
              id="emp-hire-date"
              value={hireDate}
              onChange={setHireDate}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="emp-resign-date"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              퇴사일
            </label>
            <DateInput
              id="emp-resign-date"
              value={resignDate}
              onChange={setResignDate}
              disabled={submitting}
              theme="emerald"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <BankAccountInput
          value={bankAccounts}
          onChange={setBankAccounts}
          disabled={submitting}
          theme="emerald"
          maxCount={1}
        />
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
