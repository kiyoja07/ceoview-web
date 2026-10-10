"use client";

import { useState, useEffect, useCallback } from "react";
import {
  filterPayslipChannelsForRecipient,
  getPayslipChannelLabel,
  type PayslipSendChannel,
} from "@/app/lib/payslip-delivery";
import type { IncomeTab } from "@/types/company/salary";
import { PayslipChannelSelector } from "./PayslipChannelSelector";

interface BulkPayslipSendProps {
  companyId: string;
  incomeType: IncomeTab;
  totalCount: number;
  accrualYm?: string;
  paymentYm?: string;
  onSent?: () => void;
}

const ENDPOINT_MAP: Record<IncomeTab, string> = {
  earned: "earned-income",
  business: "business-income",
  daily: "daily-income-labor",
  other: "other-income",
};

export function BulkPayslipSend({
  companyId,
  incomeType,
  totalCount,
  accrualYm,
  paymentYm,
  onSent,
}: BulkPayslipSendProps) {
  const [selectedChannels, setSelectedChannels] = useState<PayslipSendChannel[]>(
    ["EMAIL", "SMS"],
  );
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultModal, setResultModal] = useState<{
    type: "success" | "warning" | "error";
    title: string;
    lines: string[];
  } | null>(null);

  // ESC key to close modals
  useEffect(() => {
    if (!showConfirm && !resultModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirm(false);
        setResultModal(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showConfirm, resultModal]);

  const handleClick = () => {
    if (sending || totalCount === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = useCallback(async () => {
    if (selectedChannels.length === 0) {
      setResultModal({
        type: "warning",
        title: "발송 채널 필요",
        lines: ["발송할 채널을 하나 이상 선택해주세요."],
      });
      return;
    }

    setShowConfirm(false);
    setSending(true);
    setStatus("데이터 조회 중…");

    try {
      // 1. Fetch all row IDs
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("size", String(Math.max(totalCount, 10000)));
      if (accrualYm) params.set("accrualYm", accrualYm);
      if (paymentYm) params.set("paymentYm", paymentYm);

      const endpoint = `/api/company/${companyId}/${ENDPOINT_MAP[incomeType]}?${params}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`데이터 조회 실패 (${res.status})`);

      const data = await res.json();
      const rows = data.rows as {
        id: string;
        employeeEmail?: string;
        employeePhone?: string;
      }[];
      if (!rows?.length) {
        setResultModal({
          type: "warning",
          title: "발송 불가",
          lines: ["발송할 데이터가 없습니다."],
        });
        return;
      }

      // Filter to only rows with contact info
      const sendableRows = rows.filter(
        (row) =>
          filterPayslipChannelsForRecipient(selectedChannels, {
            email: row.employeeEmail,
            phone: row.employeePhone,
          }).length > 0,
      );

      if (sendableRows.length === 0) {
        setResultModal({
          type: "warning",
          title: "발송 불가",
          lines: ["이메일 또는 전화번호가 등록된 직원이 없습니다."],
        });
        return;
      }

      setStatus("발송 중…");
      setProgress({ done: 0, total: sendableRows.length });

      // 2. Send in batches of 50
      const BATCH_SIZE = 50;
      let doneCount = 0;
      let successTotal = 0;
      let failTotal = 0;

      for (let i = 0; i < sendableRows.length; i += BATCH_SIZE) {
        const batch = sendableRows.slice(i, i + BATCH_SIZE);
        const ids = batch.map((r) => r.id);

        const sendRes = await fetch(`/api/company/${companyId}/payslip-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            earnedIncomeIds: ids,
            channels: selectedChannels,
          }),
        });

        if (sendRes.ok) {
          const result = await sendRes.json();
          successTotal += result.successCount ?? 0;
          failTotal += result.failCount ?? 0;
        } else {
          failTotal += batch.length;
        }

        doneCount += batch.length;
        setProgress({ done: doneCount, total: sendableRows.length });
      }

      const skipped = rows.length - sendableRows.length;
      const lines: string[] = [
        `채널: ${selectedChannels.map(getPayslipChannelLabel).join(", ")}`,
        `성공: ${successTotal}명`,
      ];
      if (failTotal > 0) lines.push(`실패: ${failTotal}명`);
      if (skipped > 0) lines.push(`선택 채널 연락처 없음: ${skipped}명`);
      setResultModal({
        type: failTotal > 0 ? "warning" : "success",
        title: "발송 완료",
        lines,
      });
      onSent?.();
    } catch (err) {
      console.error("전체 발송 실패:", err);
      setResultModal({
        type: "error",
        title: "발송 실패",
        lines: ["발송 중 오류가 발생했습니다."],
      });
    } finally {
      setSending(false);
      setProgress({ done: 0, total: 0 });
      setStatus("");
    }
  }, [
    accrualYm,
    companyId,
    incomeType,
    onSent,
    paymentYm,
    selectedChannels,
    totalCount,
  ]);

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={sending || totalCount === 0}
        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending && (
          <div
            className="absolute inset-0 bg-indigo-500/30 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          {sending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
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
              <span>
                {status} {progress.done}/{progress.total}명 ({pct}%)
              </span>
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
              <span>전체 명세서 발송 ({totalCount}명)</span>
            </>
          )}
        </span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md animate-[fadeScaleIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="mt-4 text-center text-base font-semibold text-gray-900">
              급여명세서 전체 발송
            </h3>

            {/* Description */}
            <div className="mt-3 space-y-2 text-center text-sm text-gray-600">
              <p>
                전체{" "}
                <span className="font-semibold text-indigo-600">
                  {totalCount}명
                </span>
                에게 급여명세서 발송을 시도합니다.
              </p>
              <p className="text-xs text-gray-400">
                이메일 또는 전화번호가 등록된 직원에게만 발송됩니다.
              </p>
            </div>

            <div className="mt-4 text-left">
              <PayslipChannelSelector
                availableChannels={["EMAIL", "SMS", "KAKAO"]}
                selectedChannels={selectedChannels}
                onToggle={(channel) =>
                  setSelectedChannels((current) =>
                    current.includes(channel)
                      ? current.filter((value) => value !== channel)
                      : [...current, channel],
                  )
                }
                detailsByChannel={{
                  EMAIL: "직원 이메일 주소로 발송합니다.",
                  SMS: "휴대폰 번호로 1회용 열람 링크를 발송합니다.",
                  KAKAO: "휴대폰 번호로 카카오 비즈메시지 링크를 발송합니다.",
                }}
              />
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedChannels.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
                발송하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
          onClick={() => setResultModal(null)}
        >
          <div
            className="w-full max-w-sm animate-[fadeScaleIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                resultModal.type === "success"
                  ? "bg-emerald-50"
                  : resultModal.type === "warning"
                    ? "bg-amber-50"
                    : "bg-red-50"
              }`}
            >
              {resultModal.type === "success" ? (
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              ) : resultModal.type === "warning" ? (
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className="mt-4 text-center text-base font-semibold text-gray-900">
              {resultModal.title}
            </h3>

            {/* Lines */}
            <div className="mt-3 space-y-1 text-center text-sm text-gray-600">
              {resultModal.lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* Close button */}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setResultModal(null)}
                className="inline-flex rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe for modal entrance animation */}
      <style jsx>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
