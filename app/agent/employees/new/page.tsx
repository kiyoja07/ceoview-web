"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  Company,
  EmployeeUploadResult,
  IncomeType,
  MessageState,
  ProgramType,
} from "@/types/agent/employee";
import { INCOME_TYPES, PROGRAM_TYPES } from "./constants";
import { CompanySelectField } from "./_components/CompanySelectField";
import { FixedCompanyDisplay } from "./_components/FixedCompanyDisplay";
import { FileUploadField } from "./_components/FileUploadField";
import { IncomeTypeSelector } from "./_components/IncomeTypeSelector";
import { ProgramTypeSelector } from "./_components/ProgramTypeSelector";
import { ResultPreview } from "./_components/ResultPreview";
import { StatusMessage } from "./_components/StatusMessage";

export default function EmployeeNewPage() {
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
  const [incomeType, setIncomeType] = useState<IncomeType>("EARNED_INCOME");
  const [programType, setProgramType] = useState<ProgramType>("WEHAGO");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [result, setResult] = useState<EmployeeUploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            const exists = data.some((c) => c.id === fixedCompanyId);
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

  const resetFeedback = () => {
    setResult(null);
    setMessage(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    resetFeedback();
  };

  const clearFile = () => {
    setFile(null);
    resetFeedback();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!companyId) {
      setMessage({ type: "error", text: "사업자를 선택해주세요." });
      return;
    }
    if (!file) {
      setMessage({ type: "error", text: "엑셀 파일을 선택해주세요." });
      return;
    }

    setUploading(true);
    resetFeedback();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);
      formData.append("incomeType", incomeType);
      formData.append("programType", programType);

      const res = await fetch("/api/agent/employee/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setMessage({
          type: "success",
          text: `직원 데이터 파싱 완료 — ${data.totalRows}명 (급여 매핑: ${data.matchedCount}명, 미매핑: ${data.unmatchedCount}명)`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "업로드에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!file || !result || result.saved) return;

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);
      formData.append("incomeType", incomeType);
      formData.append("programType", programType);
      formData.append("save", "true");

      const res = await fetch("/api/agent/employee/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.saved) {
        setResult(data);
        setMessage({
          type: "success",
          text: `직원 저장 완료 — ${data.savedCount}명이 저장되었습니다. 이제 발행하면 회사에서 조회할 수 있습니다.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "저장에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!result?.saved || result.published) return;

    setPublishing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/employee/upload/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          incomeType,
        }),
      });

      const data = await res.json();

      if (res.ok && data.published) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                published: true,
                publishStatus: "PUBLISHED",
              }
            : prev,
        );
        setMessage({
          type: "success",
          text: `발행 완료 — ${data.publishedCount}명이 발행되었습니다. 이제 회사에서 조회할 수 있습니다.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "발행에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setPublishing(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                직원 엑셀 등록
              </h1>
              <p className="text-sm text-gray-500">
                사원등록 엑셀 파일을 업로드하여 급여 데이터와 매핑합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="mb-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          {/* Company Select */}
          {isFixedCompanyMode ? (
            <FixedCompanyDisplay
              companiesLoading={companiesLoading}
              fixedCompanyError={fixedCompanyError}
              selectedCompany={selectedCompany}
            />
          ) : (
            <CompanySelectField
              companiesLoading={companiesLoading}
              companies={companies}
              companyId={companyId}
              onChange={setCompanyId}
            />
          )}

          {/* Income Type */}
          <IncomeTypeSelector
            incomeType={incomeType}
            options={INCOME_TYPES}
            onChange={(value) => {
              setIncomeType(value);
              resetFeedback();
            }}
          />

          {/* Program Type */}
          <ProgramTypeSelector
            programType={programType}
            options={PROGRAM_TYPES}
            onChange={(value) => {
              setProgramType(value);
              resetFeedback();
            }}
          />

          {/* File Upload */}
          <FileUploadField
            file={file}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onClear={clearFile}
          />

          {/* Status Message */}
          <StatusMessage message={message} />

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !companyId || !file}
            className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:shadow-none"
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
                데이터 추출 중...
              </span>
            ) : (
              "엑셀 파일 업로드 및 매핑 확인"
            )}
          </button>
        </div>

        {/* Result Preview */}
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
