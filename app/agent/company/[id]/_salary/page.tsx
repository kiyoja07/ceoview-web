"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PublishStatusConfirmModal from "./_components/PublishStatusConfirmModal";
import UploadTable from "./_components/UploadTable";
import PreviewModal from "./_components/PreviewModal";
import { getCurrentYYYYMM } from "@/lib/time";
import {
  formatBusinessNumber,
  getPublishStatusLabel,
} from "./_lib/format";
import type {
  CompanyInfo,
  PublicationStatusResponse,
  UploadPreviewResponse,
  ActionType,
} from "./_lib/types";

const CURRENT_YYYYMM = getCurrentYYYYMM();

export default function AgentCompanySalaryPublicationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [status, setStatus] = useState<PublicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    uploadId: string;
    publishStatus: ActionType;
    fileName: string | null;
  } | null>(null);
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
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            급여 관리
          </h1>
          {titleCompany && (
            <p className="mt-1 text-sm text-gray-500">{titleCompany}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            업로드 전체 목록에서 항목별로 비공개/공개를 선택할 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            비공개는 세무대리인만 조회 가능, 공개는 거래처에 노출됩니다.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/agent/company/${companyId}/salary/upload`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            급여 엑셀 등록
          </Link>
          <Link
            href={`/company/${companyId}/salary?page=1&accrualYm=${CURRENT_YYYYMM}&paymentYm=${CURRENT_YYYYMM}`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            급여의 거래처용 화면 보기
          </Link>
          <div className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            총 {uploads.length}건 · {getPublishStatusLabel("PUBLISHED")}{" "}
            {publishedCount}건
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
          <UploadTable
            uploads={uploads}
            actionLoadingKey={actionLoadingKey}
            onPreview={openPreview}
            onSetPendingAction={setPendingAction}
          />
        )}
      </div>

      {pendingAction && (
        <PublishStatusConfirmModal
          fileName={pendingAction.fileName}
          publishStatus={pendingAction.publishStatus}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const { uploadId, publishStatus } = pendingAction;
            setPendingAction(null);
            runAction(uploadId, publishStatus);
          }}
        />
      )}

      {previewUploadId && (
        <PreviewModal
          previewLoading={previewLoading}
          previewError={previewError}
          previewData={previewData}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
