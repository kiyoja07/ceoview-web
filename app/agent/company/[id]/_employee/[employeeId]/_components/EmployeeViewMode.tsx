"use client";

import { useState } from "react";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import {
  display,
  displayYesNo,
  displayInsurance,
  maskResidentNumber,
  formatResidentNumber,
  getStatusColor,
  Field,
  SectionHeader,
  colors,
} from "./helpers";

type Props = {
  employee: EmployeeFullDetail;
  onEdit: () => void;
  onDelete: () => void;
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
};

export default function EmployeeViewMode({
  employee,
  onEdit,
  onDelete,
}: Props) {
  const [showResidentNumber, setShowResidentNumber] = useState(false);

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
            onClick={onEdit}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition ${colors.button}`}
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

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
          <Field label="내·외국인" value={display(employee.nationalityType)} />
          <Field label="직종구분" value={display(employee.jobCategory)} />
          <Field label="거주구분" value={display(employee.residenceType)} />
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
          <Field label="전화번호" value={display(employee.landlinePhone)} />
        </dl>
      </section>

      {/* ── 주소 ── */}
      <section>
        <SectionHeader icon={icons.map} title="주소" />
        <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="우편번호" value={display(employee.zipcode)} />
          <Field label="주소" value={display(employee.address)} />
          <Field label="상세주소" value={display(employee.addressDetail)} />
        </dl>
      </section>

      {/* ── 입·퇴사 / 급여 ── */}
      <section>
        <SectionHeader icon={icons.calendar} title="입·퇴사 / 급여" />
        <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="입사일" value={display(employee.hireDate)} />
          <Field label="퇴사일" value={display(employee.resignDate)} />
          <Field label="호봉" value={display(employee.payGrade)} />
        </dl>
      </section>

      {/* ── 부양가족 / 소득공제 ── */}
      <section>
        <SectionHeader icon={icons.family} title="부양가족 / 소득공제" />
        <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="배우자 유무" value={displayYesNo(employee.hasSpouse)} />
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
          <Field label="부녀자" value={displayYesNo(employee.deductionWomen)} />
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

      {/* ── 4대보험 ── */}
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

      {/* ── 급여 계좌 ── */}
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
}
