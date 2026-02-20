"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { INCOME_TYPES, MONTHS } from "./constants";
import { BusinessEntitySelect } from "./components/BusinessEntitySelect";
import { FileUploadField } from "./components/FileUploadField";
import { IncomeTypeSelector } from "./components/IncomeTypeSelector";
import { ResultPreview } from "./components/ResultPreview";
import { StatusMessage } from "./components/StatusMessage";
import { YearMonthField } from "./components/YearMonthField";
import { useSalaryUpload } from "./hooks/useSalaryUpload";
import type { BusinessEntity, IncomeType } from "./types";
import { buildYearOptions } from "./utils";

export default function SalaryNewPage() {
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(true);

  const [businessEntityId, setBusinessEntityId] = useState("");
  const [accrualYear, setAccrualYear] = useState(new Date().getFullYear().toString());
  const [accrualMonth, setAccrualMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [paymentMonth, setPaymentMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [payDate, setPayDate] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("EARNED_INCOME");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, saving, message, result, resetFeedback, handleUpload, handleSave } =
    useSalaryUpload({
      businessEntityId,
      file,
      accrualYear,
      accrualMonth,
      paymentYear,
      paymentMonth,
      payDate,
      incomeType,
    });

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetch("/api/agent/business-entity");
        if (res.ok) {
          const data = await res.json();
          setEntities(data);
        }
      } catch {
        console.error("사업자 목록 조회 실패");
      } finally {
        setEntitiesLoading(false);
      }
    };

    fetchEntities();
  }, []);

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

  const selectedEntity = entities.find((e) => e.id === businessEntityId);
  const years = buildYearOptions();

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">급여 엑셀 등록</h1>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 space-y-6">
        <BusinessEntitySelect
          entitiesLoading={entitiesLoading}
          entities={entities}
          businessEntityId={businessEntityId}
          onChange={setBusinessEntityId}
          selectedEntity={selectedEntity}
        />

        <YearMonthField
          label="귀속년월"
          year={accrualYear}
          month={accrualMonth}
          years={years}
          months={MONTHS}
          onYearChange={setAccrualYear}
          onMonthChange={setAccrualMonth}
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

        <div>
          <label className="block text-sm font-medium mb-1">
            지급일{" "}
            {incomeType === "EARNED_INCOME" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {incomeType !== "EARNED_INCOME" && (
            <p className="mt-1 text-xs text-gray-500">
              근로소득 업로드 시에만 지급일이 필수입니다.
            </p>
          )}
        </div>

        <IncomeTypeSelector
          incomeType={incomeType}
          options={INCOME_TYPES}
          onChange={(value) => {
            setIncomeType(value);
            resetFeedback();
          }}
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
          disabled={uploading || !businessEntityId || !file}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? "업로드 중..." : "엑셀 업로드"}
        </button>
      </div>

      {result && <ResultPreview result={result} saving={saving} onSave={handleSave} />}
    </div>
  );
}
