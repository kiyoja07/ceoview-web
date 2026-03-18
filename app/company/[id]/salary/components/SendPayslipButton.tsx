"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  getAvailablePayslipChannels,
  type PayslipSendChannel,
} from "@/app/lib/payslip-delivery";
import type { EarnedIncomeRow } from "../types";
import { PayslipChannelSelector } from "./PayslipChannelSelector";

interface SendPayslipButtonProps {
  companyId: string;
  row: EarnedIncomeRow;
  onSent?: () => void;
}

function AlertModal({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isError = type === "error";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isError ? "bg-red-100" : "bg-green-100"
            }`}
          >
            {isError ? (
              <svg
                className="h-5 w-5 text-red-600"
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
            ) : (
              <svg
                className="h-5 w-5 text-green-600"
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
            )}
          </div>
          <div>
            <h3
              className={`text-base font-semibold ${isError ? "text-red-900" : "text-gray-900"}`}
            >
              {isError ? "발송 실패" : "발송 완료"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              isError
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmModal({
  employeeName,
  availableChannels,
  selectedChannels,
  channelDetails,
  onToggleChannel,
  onConfirm,
  onCancel,
}: {
  employeeName: string;
  availableChannels: PayslipSendChannel[];
  selectedChannels: PayslipSendChannel[];
  channelDetails: Partial<Record<PayslipSendChannel, string>>;
  onToggleChannel: (channel: PayslipSendChannel) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">
          급여명세서 발송
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{employeeName}</span>
          님에게 급여명세서를 발송합니다.
        </p>
        <div className="mt-4">
          <PayslipChannelSelector
            availableChannels={availableChannels}
            selectedChannels={selectedChannels}
            onToggle={onToggleChannel}
            detailsByChannel={channelDetails}
          />
        </div>
        {selectedChannels.length === 0 && (
          <p className="mt-3 text-xs text-red-600">
            발송할 채널을 하나 이상 선택해주세요.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={selectedChannels.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            발송
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SendPayslipButton({
  companyId,
  row,
  onSent,
}: SendPayslipButtonProps) {
  const availableChannels = useMemo(
    () =>
      getAvailablePayslipChannels({
        email: row.employeeEmail,
        phone: row.employeePhone,
      }),
    [row.employeeEmail, row.employeePhone],
  );
  const defaultChannels = useMemo(
    () => availableChannels.filter((channel) => channel !== "KAKAO"),
    [availableChannels],
  );
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedChannels, setSelectedChannels] =
    useState<PayslipSendChannel[]>(defaultChannels);
  const [alertState, setAlertState] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setSelectedChannels((current) => {
      const next = current.filter((channel) =>
        availableChannels.includes(channel),
      );
      if (next.length > 0) return next;
      return defaultChannels;
    });
  }, [defaultChannels, availableChannels]);

  const hasContact = availableChannels.length > 0;
  const channelDetails: Partial<Record<PayslipSendChannel, string>> = {
    EMAIL: row.employeeEmail ? `이메일 (${row.employeeEmail})` : undefined,
    SMS: row.employeePhone ? `문자 (${row.employeePhone})` : undefined,
    KAKAO: row.employeePhone ? `카카오톡 (${row.employeePhone})` : undefined,
  };

  const handleClick = () => {
    if (sending || !hasContact) return;
    setShowConfirm(true);
  };

  const toggleChannel = (channel: PayslipSendChannel) => {
    setSelectedChannels((current) =>
      current.includes(channel)
        ? current.filter((value) => value !== channel)
        : [...current, channel],
    );
  };

  const handleConfirm = useCallback(async () => {
    if (selectedChannels.length === 0) return;
    setShowConfirm(false);
    setSending(true);
    try {
      const res = await fetch(`/api/company/${companyId}/payslip-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          earnedIncomeIds: [row.id],
          channels: selectedChannels,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAlertState({
          message: data.error ?? "발송에 실패했습니다.",
          type: "error",
        });
        return;
      }

      const result = data.results?.[0];
      if (result) {
        const msgs: string[] = [];
        if (result.emailSent) msgs.push("이메일 발송 완료");
        if (result.smsSent) msgs.push("문자 발송 완료");
        if (result.kakaoSent) msgs.push("카카오톡 발송 완료");
        if (result.error) msgs.push(result.error);
        const hasError =
          !result.emailSent && !result.smsSent && !result.kakaoSent;
        setAlertState({
          message: `${row.employeeName}님: ${msgs.join(", ")}`,
          type: hasError ? "error" : "success",
        });
      }

      onSent?.();
    } catch {
      setAlertState({
        message: "발송 중 오류가 발생했습니다.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  }, [companyId, onSent, row.id, row.employeeName, selectedChannels]);

  if (!hasContact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-400">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        연락처 없음
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={sending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
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
            발송 중…
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
            명세서 발송
            <span className="ml-0.5 flex items-center gap-1 text-xs opacity-80">
              {row.employeeEmail && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              )}
              {row.employeePhone && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                  />
                </svg>
              )}
            </span>
          </>
        )}
      </button>
      {showConfirm && (
        <ConfirmModal
          employeeName={row.employeeName}
          availableChannels={availableChannels}
          selectedChannels={selectedChannels}
          channelDetails={channelDetails}
          onToggleChannel={toggleChannel}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {alertState && (
        <AlertModal
          message={alertState.message}
          type={alertState.type}
          onClose={() => setAlertState(null)}
        />
      )}
    </>
  );
}
