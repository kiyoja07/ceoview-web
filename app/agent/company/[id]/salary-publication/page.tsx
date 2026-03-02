"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PublicationUpload = {
  pointerId?: string;
  uploadId: string;
  incomeType: string;
  incomeTypeLabel: string;
  fileName: string | null;
  uploadedAt: string;
  publishedAt?: string;
  companyVisible: boolean;
  publishStatus: "SAVED" | "PUBLISHED";
  canManage: boolean;
};

type PublicationStatusResponse = {
  success: boolean;
  uploads: PublicationUpload[];
};

type UploadPreviewColumn = {
  key: string;
  label: string;
};

type UploadPreviewRow = Record<string, unknown>;

type UploadPreviewResponse = {
  success: boolean;
  upload: {
    uploadId: string;
    incomeType: string;
    incomeTypeLabel: string;
    fileName: string | null;
    uploadedAt: string;
    publishStatus: "SAVED" | "PUBLISHED";
    companyVisible: boolean;
  };
  columns: UploadPreviewColumn[];
  rows: UploadPreviewRow[];
  total: number;
  limit: number;
};

type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

type ActionType = "SAVED" | "PUBLISHED";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const YM_COLUMN_KEYS = new Set(["accrualYm", "paymentYm"]);
const NUMERIC_TEXT_REGEX = /^-?\d+(\.\d+)?$/;
const NON_SUM_COLUMN_KEYS = new Set([
  "employeeCode",
  "employeeName",
  "incomeType",
  "jobType",
  "position",
  "payDate",
  "accrualYm",
  "paymentYm",
]);

function formatNumericTextWithComma(value: string) {
  const negative = value.startsWith("-");
  const absValue = negative ? value.slice(1) : value;
  const [integerPart, fractionPart] = absValue.split(".");
  const commaInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const joined =
    fractionPart !== undefined ? `${commaInt}.${fractionPart}` : commaInt;
  return negative ? `-${joined}` : joined;
}

function formatPreviewValue(value: unknown, columnKey: string) {
  if (value === null || value === undefined || value === "") return "-";

  if (YM_COLUMN_KEYS.has(columnKey)) {
    return String(value);
  }

  if (typeof value === "boolean") return value ? "Y" : "N";

  if (typeof value === "number") return value.toLocaleString("ko-KR");

  if (typeof value === "string") {
    const normalized = value.trim();
    if (NUMERIC_TEXT_REGEX.test(normalized)) {
      return formatNumericTextWithComma(normalized);
    }
    return value;
  }

  return String(value);
}

function toNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!NUMERIC_TEXT_REGEX.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export default function AgentCompanySalaryPublicationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [status, setStatus] = useState<PublicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [previewUploadId, setPreviewUploadId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<UploadPreviewResponse | null>(
    null,
  );

  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [companyRes, statusRes] = await Promise.all([
          fetch(`/api/agent/company/${companyId}/info`, { cache: "no-store" }),
          fetch(`/api/agent/company/${companyId}/salary-publication`, {
            cache: "no-store",
          }),
        ]);

        if (companyRes.status === 401 || statusRes.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }

        if (companyRes.status === 403 || statusRes.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (!companyRes.ok) {
          const body = await companyRes.json().catch(() => null);
          setError(body?.error || "거래처 정보를 불러오지 못했습니다.");
          return;
        }

        if (!statusRes.ok) {
          const body = await statusRes.json().catch(() => null);
          setError(body?.error || "발행 상태를 불러오지 못했습니다.");
          return;
        }

        setCompany((await companyRes.json()) as CompanyInfo);
        setStatus((await statusRes.json()) as PublicationStatusResponse);
      } catch {
        setError("발행 관리 화면을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [companyId, router]);

  async function runAction(uploadId: string, publishStatus: ActionType) {
    if (!companyId) return;

    const key = `${uploadId}:${publishStatus}`;
    setActionLoadingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `/api/agent/company/${companyId}/salary-publication`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setUploadStatus",
            uploadId,
            publishStatus,
          }),
        },
      );

      const body = (await res.json().catch(() => null)) as
        | PublicationStatusResponse
        | { error?: string }
        | null;

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        const message =
          body && "error" in body
            ? (body.error ?? "권한이 없습니다.")
            : "권한이 없습니다.";

        if (message.includes("소속 에이전트 조직")) {
          router.replace("/agent/auth/organization");
          return;
        }

        setError(message);
        return;
      }

      if (!res.ok) {
        setError(
          body && "error" in body
            ? (body.error ?? "처리에 실패했습니다.")
            : "처리에 실패했습니다.",
        );
        return;
      }

      setStatus(body as PublicationStatusResponse);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function openPreview(uploadId: string) {
    if (!companyId) return;

    setPreviewUploadId(uploadId);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);

    try {
      const res = await fetch(
        `/api/agent/company/${companyId}/salary-publication/uploads/${uploadId}?limit=100`,
        {
          cache: "no-store",
        },
      );

      const body = (await res.json().catch(() => null)) as
        | UploadPreviewResponse
        | { error?: string }
        | null;

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        const message =
          body && "error" in body
            ? (body.error ?? "권한이 없습니다.")
            : "권한이 없습니다.";

        if (message.includes("소속 에이전트 조직")) {
          router.replace("/agent/auth/organization");
          return;
        }

        setPreviewError(message);
        return;
      }

      if (!res.ok) {
        setPreviewError(
          body && "error" in body
            ? (body.error ?? "미리보기를 불러오지 못했습니다.")
            : "미리보기를 불러오지 못했습니다.",
        );
        return;
      }

      setPreviewData(body as UploadPreviewResponse);
    } catch {
      setPreviewError("미리보기 요청 중 오류가 발생했습니다.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewUploadId(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewData(null);
  }

  const titleCompany = useMemo(() => {
    if (!company) return "";
    const number = formatBusinessNumber(company.businessNumber);
    return company.businessName
      ? `${company.businessName} (${number})`
      : number;
  }, [company]);

  const uploads = status?.uploads ?? [];
  const publishedCount = uploads.filter(
    (item) => item.publishStatus === "PUBLISHED",
  ).length;
  const previewColumnSums = useMemo(() => {
    if (!previewData || previewData.rows.length === 0) return null;

    const sums: Record<string, number> = {};
    let hasSum = false;

    for (const column of previewData.columns) {
      if (NON_SUM_COLUMN_KEYS.has(column.key)) continue;

      let total = 0;
      let numericCount = 0;

      for (const row of previewData.rows) {
        const numeric = toNumericValue(row[column.key]);
        if (numeric === null) continue;
        total += numeric;
        numericCount += 1;
      }

      if (numericCount > 0) {
        sums[column.key] = total;
        hasSum = true;
      }
    }

    return hasSum ? sums : null;
  }, [previewData]);

  return (
    <div className="min-h-screen bg-agent-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            급여 발행 관리
          </h1>
          {titleCompany && (
            <p className="mt-1 text-sm text-gray-500">{titleCompany}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            업로드 전체 목록에서 항목별로 SAVED/PUBLISHED를 선택할 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            SAVED는 agent만 조회 가능, PUBLISHED만 company에 노출됩니다.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/agent/salary/new?companyId=${companyId}`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            급여 엑셀 등록
          </Link>
          <Link
            href={`/company/${companyId}/salary`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            급여의 거래처용 화면 보기
          </Link>
          <div className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            총 {uploads.length}건 · PUBLISHED {publishedCount}건
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">발행 상태를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              조회 가능한 업로드 항목이 없습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">업로드 시각</th>
                    <th className="px-4 py-3 text-left">소득 유형</th>
                    <th className="px-4 py-3 text-left">파일명</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">회사 노출</th>
                    <th className="px-4 py-3 text-left">상태 선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {uploads.map((upload) => {
                    const rowBusy =
                      actionLoadingKey !== null &&
                      actionLoadingKey.startsWith(`${upload.uploadId}:`);

                    return (
                      <tr key={upload.uploadId} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3 text-gray-700">
                          {formatDateTime(upload.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {upload.incomeTypeLabel}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <button
                            type="button"
                            onClick={() => openPreview(upload.uploadId)}
                            className="max-w-80 truncate text-left text-blue-700 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800"
                            title={upload.fileName ?? "파일명 없음"}
                          >
                            {upload.fileName ?? "파일명 없음"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {upload.publishStatus === "PUBLISHED" ? (
                            <div className="space-y-1">
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                PUBLISHED
                              </span>
                              <p className="text-xs text-blue-700">
                                발행:{" "}
                                {upload.publishedAt
                                  ? formatDateTime(upload.publishedAt)
                                  : "-"}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              SAVED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {upload.companyVisible ? (
                            <span className="font-medium text-blue-700">
                              조회 가능
                            </span>
                          ) : (
                            <span className="font-medium text-amber-700">
                              조회 불가
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                rowBusy ||
                                !upload.canManage ||
                                upload.publishStatus === "SAVED"
                              }
                              onClick={() =>
                                runAction(upload.uploadId, "SAVED")
                              }
                              className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                upload.publishStatus === "SAVED"
                                  ? "bg-amber-200 text-amber-800"
                                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              SAVED
                            </button>
                            <button
                              type="button"
                              disabled={
                                rowBusy ||
                                !upload.canManage ||
                                upload.publishStatus === "PUBLISHED"
                              }
                              onClick={() =>
                                runAction(upload.uploadId, "PUBLISHED")
                              }
                              className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                upload.publishStatus === "PUBLISHED"
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {rowBusy &&
                              actionLoadingKey ===
                                `${upload.uploadId}:PUBLISHED`
                                ? "전환 중..."
                                : "PUBLISHED"}
                            </button>
                            {!upload.canManage && (
                              <span className="text-xs text-gray-400">
                                저장자만 변경 가능
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewUploadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
          <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  업로드 데이터 미리보기
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {previewData
                    ? `${previewData.upload.incomeTypeLabel} / ${previewData.upload.fileName ?? "파일명 없음"}`
                    : "업로드 데이터를 불러오는 중입니다."}
                </p>
                {previewData && (
                  <p className="mt-1 text-xs text-gray-400">
                    업로드: {formatDateTime(previewData.upload.uploadedAt)} ·
                    상태: {previewData.upload.publishStatus}
                  </p>
                )}
                {previewData && (
                  <p className="mt-1 text-xs text-gray-400">
                    총 {previewData.total.toLocaleString()}건 중{" "}
                    {Math.min(
                      previewData.total,
                      previewData.limit,
                    ).toLocaleString()}
                    건 미리보기
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                닫기
              </button>
            </div>

            <div className="min-h-0 flex-1 p-4">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    데이터를 불러오는 중...
                  </p>
                </div>
              ) : previewError ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-red-50">
                  <p className="text-sm text-red-700">{previewError}</p>
                </div>
              ) : !previewData ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    표시할 데이터가 없습니다.
                  </p>
                </div>
              ) : previewData.rows.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    저장된 데이터 행이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-auto rounded-xl border border-gray-200">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        {previewData.columns.map((column) => (
                          <th key={column.key} className="px-3 py-2 text-left">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.rows.map((row, index) => (
                        <tr key={`${previewData.upload.uploadId}:${index}`}>
                          {previewData.columns.map((column) => (
                            <td
                              key={`${column.key}:${index}`}
                              className="px-3 py-2 whitespace-nowrap text-gray-700"
                            >
                              {formatPreviewValue(row[column.key], column.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {previewColumnSums && (
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-slate-50 text-sm font-semibold text-gray-800">
                          {previewData.columns.map((column, index) => {
                            const total = previewColumnSums[column.key];
                            return (
                              <td
                                key={`sum:${column.key}`}
                                className="px-3 py-2 whitespace-nowrap"
                              >
                                {index === 0
                                  ? "합계"
                                  : total === undefined
                                    ? "-"
                                    : formatPreviewValue(total, column.key)}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
