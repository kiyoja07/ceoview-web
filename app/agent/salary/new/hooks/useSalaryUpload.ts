import { useState } from "react";
import type { IncomeType, MessageState, ParsedResult } from "../types";

type Params = {
  businessEntityId: string;
  file: File | null;
  accrualYear: string;
  accrualMonth: string;
  paymentYear: string;
  paymentMonth: string;
  payDate: string;
  incomeType: IncomeType;
};

function createBaseFormData(params: Params) {
  const formData = new FormData();
  const accrualYm = `${params.accrualYear}${params.accrualMonth}`;
  const paymentYm = `${params.paymentYear}${params.paymentMonth}`;

  if (params.file) {
    formData.append("file", params.file);
  }

  formData.append("businessEntityId", params.businessEntityId);
  formData.append("accrualYm", accrualYm);
  formData.append("paymentYm", paymentYm);
  if (params.payDate) formData.append("payDate", params.payDate);
  formData.append("incomeType", params.incomeType);

  return formData;
}

export function useSalaryUpload(params: Params) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);

  const resetFeedback = () => {
    setResult(null);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!params.businessEntityId) {
      setMessage({ type: "error", text: "사업자를 선택해주세요." });
      return;
    }

    if (!params.file) {
      setMessage({ type: "error", text: "엑셀 파일을 선택해주세요." });
      return;
    }

    if (params.incomeType === "EARNED_INCOME" && !params.payDate) {
      setMessage({ type: "error", text: "근로소득은 지급일을 선택해주세요." });
      return;
    }

    setUploading(true);
    resetFeedback();

    try {
      const formData = createBaseFormData(params);
      const res = await fetch("/api/agent/salary/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setMessage({
          type: "success",
          text: `${data.incomeTypeLabel} 엑셀 파싱 완료 — ${data.totalRows}건`,
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
    if (!params.file || !result || result.saved) return;

    if (params.incomeType === "EARNED_INCOME" && !params.payDate) {
      setMessage({ type: "error", text: "근로소득은 지급일을 선택해주세요." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = createBaseFormData(params);
      formData.append("save", "true");

      const res = await fetch("/api/agent/salary/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.saved) {
        setResult(data);
        setMessage({
          type: "success",
          text: `DB 저장 완료 — ${data.savedCount}건이 저장되었습니다.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "DB 저장에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  return {
    uploading,
    saving,
    message,
    result,
    resetFeedback,
    handleUpload,
    handleSave,
  };
}
