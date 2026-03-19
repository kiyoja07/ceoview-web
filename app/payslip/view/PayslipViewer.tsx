"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPayslipFileName,
  renderPayslipPdfFromData,
} from "@/app/company/[id]/salary/lib/payslip-pdf";
import {
  renderPayslipHtml,
  type PayslipData,
} from "@/app/company/[id]/salary/lib/payslip-template";
import type { EmployeeAuthResponse } from "@/types/employee/auth";

interface PayslipViewerProps {
  payslipData: PayslipData;
  signupGrant?: string | null;
  employeeAccountExists: boolean;
  employeeAccountActive: boolean;
  employeeLoginHint?: string | null;
  signupContactHint?: string | null;
  employeeSignupUnavailableReason?: string | null;
}

async function downloadPayslipPdf(payslipData: PayslipData) {
  const blob = await renderPayslipPdfFromData(payslipData);
  const fileName = getPayslipFileName(payslipData);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function PayslipViewer({
  payslipData,
  signupGrant,
  employeeAccountExists,
  employeeAccountActive,
  employeeLoginHint,
  signupContactHint,
  employeeSignupUnavailableReason,
}: PayslipViewerProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [employeeSignupCompleted, setEmployeeSignupCompleted] = useState(false);
  const autoDownloadTriggeredRef = useRef(false);
  const payslipHtml = useMemo(
    () => renderPayslipHtml(payslipData),
    [payslipData],
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      await downloadPayslipPdf(payslipData);
    } catch (error) {
      console.error("급여명세서 PDF 다운로드 실패:", error);
      setDownloadError(
        "PDF 다운로드에 실패했습니다. 버튼으로 다시 시도해 주세요.",
      );
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownloadTriggeredRef.current) {
      return;
    }

    autoDownloadTriggeredRef.current = true;
    void (async () => {
      try {
        setDownloading(true);
        setDownloadError(null);
        await downloadPayslipPdf(payslipData);
      } catch (error) {
        console.error("급여명세서 PDF 자동 다운로드 실패:", error);
        setDownloadError(
          "자동 다운로드에 실패했습니다. 버튼으로 다시 시도해 주세요.",
        );
      } finally {
        setDownloading(false);
      }
    })();
  }, [payslipData]);

  const handleEmployeeSignup = async () => {
    if (!signupGrant || signupLoading) {
      return;
    }

    try {
      setSignupLoading(true);
      setSignupMessage(null);

      const res = await fetch("/api/employee/auth/signup-from-payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupGrant }),
      });

      const data = (await res.json()) as EmployeeAuthResponse;
      if (!res.ok) {
        setSignupMessage({
          type: "error",
          text: data.error || "직원 계정 생성에 실패했습니다.",
        });
        return;
      }

      setEmployeeSignupCompleted(true);
      setSignupMessage({
        type: "success",
        text: data.message || "직원 계정 생성이 완료되었습니다.",
      });
    } catch {
      setSignupMessage({
        type: "error",
        text: "직원 계정 생성 중 오류가 발생했습니다.",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">급여명세서 열람</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">
              {payslipData.employeeName}님 명세서
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              링크는 1회용으로 처리되며, 현재 화면에서만 확인할 수 있습니다.
            </p>
            <p
              className={`mt-2 text-sm ${
                downloadError ? "text-red-600" : "text-blue-700"
              }`}
            >
              {downloadError ??
                "화면 진입 시 PDF 다운로드를 자동으로 시도했습니다. 시작되지 않으면 아래 버튼을 눌러주세요."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "PDF 생성 중..." : "PDF 다운로드"}
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm font-medium text-slate-900">직원 계정</p>

          {employeeSignupCompleted ? (
            <>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                직원 계정 생성이 완료되었습니다. 지금 바로 직원 포털로 이동할 수 있습니다.
              </p>
              {signupMessage && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {signupMessage.text}
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/employee")}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  직원 포털로 이동
                </button>
                <Link
                  href="/employee/auth/login"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  로그인 링크 다시 받기
                </Link>
              </div>
            </>
          ) : employeeAccountExists ? (
            <>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                이 직원으로 생성된 계정이 이미 있습니다.
              </p>
              {employeeLoginHint && (
                <p className="mt-2 text-sm text-gray-500">{employeeLoginHint}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {employeeAccountActive
                  ? "아래 버튼으로 로그인 링크를 받아 직원 포털에 접속할 수 있습니다."
                  : "현재 계정이 비활성화되어 있어 로그인할 수 없습니다. 회사 담당자에게 문의해 주세요."}
              </p>
              {employeeAccountActive && (
                <div className="mt-4">
                  <Link
                    href="/employee/auth/login"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    직원 로그인
                  </Link>
                </div>
              )}
            </>
          ) : signupGrant ? (
            <>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                현재 확인된 급여명세서 수신 정보로 직원 계정을 만들 수 있습니다.
              </p>
              {signupContactHint && (
                <p className="mt-2 text-sm text-gray-500">
                  검증된 연락처: {signupContactHint}
                </p>
              )}
              {signupMessage && (
                <div
                  className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                    signupMessage.type === "error"
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "border border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  {signupMessage.text}
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleEmployeeSignup}
                  disabled={signupLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signupLoading ? "직원 계정 생성 중..." : "직원 계정 만들기"}
                </button>
                <Link
                  href="/employee/auth/login"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  기존 직원 계정 로그인
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {employeeSignupUnavailableReason ||
                "직원 계정을 만들 수 있는 정보가 아직 준비되지 않았습니다."}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-950/5">
          <div
            className="overflow-x-auto p-4 sm:p-8"
            dangerouslySetInnerHTML={{ __html: payslipHtml }}
          />
        </div>
      </div>
    </main>
  );
}
