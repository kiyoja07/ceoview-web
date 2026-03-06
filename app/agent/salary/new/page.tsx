"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INCOME_TYPES, MONTHS, PROGRAM_TYPES } from "./constants";
import { CompanySelect } from "./components/CompanySelect";
import { FixedCompanyDisplay } from "./components/FixedCompanyDisplay";
import { FileUploadField } from "./components/FileUploadField";
import { IncomeTypeSelector } from "./components/IncomeTypeSelector";
import { ProgramTypeSelector } from "./components/ProgramTypeSelector";
import { ResultPreview } from "./components/ResultPreview";
import { StatusMessage } from "./components/StatusMessage";
import { PayDatePicker } from "./components/PayDatePicker";
import { YearMonthField } from "./components/YearMonthField";
import { useSalaryUpload } from "./hooks/useSalaryUpload";
import type { Company, IncomeType, ProgramType } from "./types";
import { buildYearOptions } from "./utils";

export default function SalaryNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fixedCompanyId = searchParams.get("companyId")?.trim() ?? "";
  const isFixedCompanyMode = fixedCompanyId.length > 0;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [fixedCompanyError, setFixedCompanyError] = useState<string | null>(
    null,
  );

  const [companyId, setCompanyId] = useState("");
  const [accrualYear, setAccrualYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [accrualMonth, setAccrualMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [paymentYear, setPaymentYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [paymentMonth, setPaymentMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [payDate, setPayDate] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("EARNED_INCOME");
  const [programType, setProgramType] = useState<ProgramType>("WEHAGO");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploading,
    saving,
    publishing,
    message,
    result,
    resetFeedback,
    handleUpload,
    handleSave,
    handlePublish,
  } = useSalaryUpload({
    companyId,
    file,
    accrualYear,
    accrualMonth,
    paymentYear,
    paymentMonth,
    payDate,
    incomeType,
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/agent/company");
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as Company[];
          setCompanies(data);
          if (isFixedCompanyMode) {
            const exists = data.some(
              (company) => company.id === fixedCompanyId,
            );
            if (exists) {
              setCompanyId(fixedCompanyId);
              setFixedCompanyError(null);
            } else {
              setCompanyId("");
              setFixedCompanyError(
                "유효하지 않은 사업자입니다. 사업자 목록에서 다시 선택해주세요.",
              );
            }
          }
        }
      } catch {
        console.error("사업자 목록 조회 실패");
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, [fixedCompanyId, isFixedCompanyMode, router]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    resetFeedback();
  };

  const clearFile = () => {
    setFile(null);
    resetFeedback();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedCompany = companies.find((company) => company.id === companyId);
  const years = buildYearOptions();

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                급여 엑셀 등록
              </h1>
              <p className="text-sm text-gray-500">
                엑셀 파일을 업로드하여 급여 데이터를 등록합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="mb-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          {isFixedCompanyMode ? (
            <FixedCompanyDisplay
              companiesLoading={companiesLoading}
              fixedCompanyError={fixedCompanyError}
              selectedCompany={selectedCompany}
            />
          ) : (
            <CompanySelect
              companiesLoading={companiesLoading}
              companies={companies}
              companyId={companyId}
              onChange={setCompanyId}
            />
          )}

          <IncomeTypeSelector
            incomeType={incomeType}
            options={INCOME_TYPES}
            onChange={(value) => {
              setIncomeType(value);
              resetFeedback();
            }}
          />

          {/* 귀속/지급년월 2열 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <YearMonthField
              label="귀속년월"
              year={accrualYear}
              month={accrualMonth}
              years={years}
              months={MONTHS}
              onYearChange={(v) => {
                setAccrualYear(v);
                setPaymentYear(v);
              }}
              onMonthChange={(v) => {
                setAccrualMonth(v);
                setPaymentMonth(v);
              }}
            />

            <YearMonthField
              label="지급년월"
              year={paymentYear}
              month={paymentMonth}
              years={years}
              months={MONTHS}
              onYearChange={setPaymentYear}
              onMonthChange={setPaymentMonth}
            />
          </div>

          <PayDatePicker
            value={payDate}
            onChange={setPayDate}
            label="지급일"
            required={incomeType === "EARNED_INCOME"}
            hint={
              incomeType !== "EARNED_INCOME"
                ? "근로소득 업로드 시에만 지급일이 필수입니다."
                : undefined
            }
          />

          <ProgramTypeSelector
            programType={programType}
            options={PROGRAM_TYPES}
            onChange={setProgramType}
          />

          <FileUploadField
            file={file}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onClear={clearFile}
          />

          <StatusMessage message={message} />

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !companyId || !file}
            className="w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400 disabled:shadow-none"
          >
            {uploading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                업로드 중...
              </span>
            ) : (
              "엑셀 파일 등록하기"
            )}
          </button>
        </div>

        {result && (
          <ResultPreview
            result={result}
            saving={saving}
            publishing={publishing}
            onSave={handleSave}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}
