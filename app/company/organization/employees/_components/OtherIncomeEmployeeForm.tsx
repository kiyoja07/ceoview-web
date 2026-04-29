"use client";

import { useState } from "react";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";
import BankAccountInput, {
  type BankAccountValue,
} from "@/app/_components/BankAccountInput";
import ResidentNumberInput, {
  validateResidentNumber,
} from "@/app/_components/ResidentNumberInput";
import EmailInput, { validateEmail } from "@/app/_components/EmailInput";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";

type OtherIncomeEmployeeFormData = {
  employeeCode: string;
  name: string;
  residentNumber: string;
  nationalityType: string;
  residenceType: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  email: string;
  phone: string;
  bankAccounts: BankAccountValue[];
};

type OtherIncomeEmployeeFormProps = {
  initialData?: Partial<OtherIncomeEmployeeFormData>;
  onSubmit: (data: OtherIncomeEmployeeFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  showEmployeeCode?: boolean;
  requireResidentNumber?: boolean;
};

export function OtherIncomeEmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  showEmployeeCode = true,
  requireResidentNumber = false,
}: OtherIncomeEmployeeFormProps) {
  const [employeeCode, setEmployeeCode] = useState(
    initialData?.employeeCode ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [residentNumber, setResidentNumber] = useState(
    initialData?.residentNumber ?? "",
  );
  const [nationalityType, setNationalityType] = useState(
    initialData?.nationalityType ?? "내국인",
  );
  const [residenceType, setResidenceType] = useState(
    initialData?.residenceType ?? "거주자",
  );
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: initialData?.zipcode ?? "",
    address: initialData?.address ?? "",
    addressDetail: initialData?.addressDetail ?? "",
  });
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [bankAccounts, setBankAccounts] = useState<BankAccountValue[]>(
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

    const residentError = validateResidentNumber(residentNumber, {
      required: requireResidentNumber,
    });
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

    if (
      bankAccounts.length > 0 &&
      bankAccounts.some(
        (bankAccount) =>
          !bankAccount.bankName.trim() ||
          !bankAccount.accountNumber.trim() ||
          !bankAccount.accountHolder.trim(),
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
        nationalityType: nationalityType.trim(),
        residenceType: residenceType.trim(),
        zipcode: addressValue.zipcode.trim(),
        address: addressValue.address.trim(),
        addressDetail: addressValue.addressDetail.trim(),
        email: email.trim(),
        phone: phone.trim(),
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
              htmlFor="oi-emp-name"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="oi-emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={inputClass}
              disabled={submitting}
            />
          </div>
          {showEmployeeCode && (
            <div>
              <label
                htmlFor="oi-emp-code"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                사원코드
              </label>
              <input
                id="oi-emp-code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP001"
                className={inputClass}
                disabled={submitting}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="oi-emp-resident"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              주민등록번호
              {requireResidentNumber && (
                <span className="text-red-500"> *</span>
              )}
            </label>
            <ResidentNumberInput
              id="oi-emp-resident"
              value={residentNumber}
              onChange={setResidentNumber}
              disabled={submitting}
              theme="emerald"
              required={requireResidentNumber}
            />
          </div>
          <div>
            <label
              htmlFor="oi-emp-nationality"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              내·외국인
            </label>
            <select
              id="oi-emp-nationality"
              value={nationalityType}
              onChange={(e) => setNationalityType(e.target.value)}
              className={inputClass}
              disabled={submitting}
            >
              <option value="내국인">내국인</option>
              <option value="외국인">외국인</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="oi-emp-residence"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              거주구분
            </label>
            <select
              id="oi-emp-residence"
              value={residenceType}
              onChange={(e) => setResidenceType(e.target.value)}
              className={inputClass}
              disabled={submitting}
            >
              <option value="거주자">거주자</option>
              <option value="비거주자">비거주자</option>
            </select>
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
        <h2 className="mb-1 text-base font-semibold text-gray-900">연락처</h2>
        <p className="mb-4 text-xs text-gray-500">
          연락처로 급여명세서를 자동으로 발송할 수 있습니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="oi-emp-email"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              이메일
            </label>
            <EmailInput
              id="oi-emp-email"
              value={email}
              onChange={setEmail}
              disabled={submitting}
              theme="emerald"
            />
          </div>
          <div>
            <label
              htmlFor="oi-emp-phone"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              휴대폰번호
            </label>
            <PhoneInput
              id="oi-emp-phone"
              value={phone}
              onChange={setPhone}
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
