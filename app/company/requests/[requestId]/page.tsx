"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  CompanyChangeRequestDetailResponse,
  CompanyChangeRequestItem,
} from "@/types/company/change-request";

const REQUEST_FIELD_LABELS = [
  ["employeeCode", "사원코드"],
  ["name", "이름"],
  ["residentNumber", "주민등록번호"],
  ["department", "부서"],
  ["positionTitle", "직책"],
  ["email", "이메일"],
  ["phone", "휴대폰"],
  ["hireDate", "입사일"],
  ["resignDate", "퇴사일"],
  ["zipcode", "우편번호"],
  ["address", "주소"],
  ["addressDetail", "상세주소"],
  ["businessName", "상호명"],
  ["representativeName", "대표자명"],
  ["openingDate", "개업일"],
  ["bankAccounts", "급여계좌"],
] as const;

function formatScope(scope: CompanyChangeRequestItem["scope"]) {
  return scope === "EMPLOYEE" ? "직원" : "회사 정보";
}

function formatAction(action: CompanyChangeRequestItem["action"]) {
  if (action === "CREATE") return "등록";
  if (action === "UPDATE") return "수정";
  return "삭제";
}

function formatStatus(status: CompanyChangeRequestItem["status"]) {
  if (status === "PENDING") return "접수중";
  if (status === "APPROVED") return "승인";
  return "반려";
}

function getStatusClass(status: CompanyChangeRequestItem["status"]) {
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  return "bg-rose-100 text-rose-700";
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || "-";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "예" : "아니오";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return "-";
        const row = item as {
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
        };
        return [
          row.bankName || "-",
          row.accountNumber || "-",
          row.accountHolder || "-",
        ].join(" / ");
      })
      .join(", ");
  }
  return "-";
}

function getChangedEntries(item: CompanyChangeRequestItem) {
  const current =
    (item.currentSnapshot as Record<string, unknown> | null) ?? {};
  const requested =
    (item.requestedPayload as Record<string, unknown> | null) ?? {};

  return REQUEST_FIELD_LABELS.map(([key, label]) => {
    const currentValue = formatValue(current[key]);
    const requestedValue = formatValue(requested[key]);

    return {
      key,
      label,
      currentValue,
      requestedValue,
      changed: currentValue !== requestedValue,
    };
  }).filter((entry) => entry.changed);
}

function getRequestedEntries(item: CompanyChangeRequestItem) {
  const requested =
    (item.requestedPayload as Record<string, unknown> | null) ?? {};

  return REQUEST_FIELD_LABELS.map(([key, label]) => ({
    key,
    label,
    value: formatValue(requested[key]),
  })).filter((entry) => entry.value !== "-");
}

export default function CompanyRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const router = useRouter();
  const requestId = params?.requestId;

  const [item, setItem] = useState<CompanyChangeRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/company/requests/${requestId}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/company/auth/login");
          return;
        }
        const body = (await res.json()) as
          | CompanyChangeRequestDetailResponse
          | { error?: string };
        if (!res.ok) {
          throw new Error(
            ("error" in body ? body.error : undefined) ||
              "요청 상세를 불러오지 못했습니다.",
          );
        }
        setItem((body as CompanyChangeRequestDetailResponse).item);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "요청 상세를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [requestId, router]);

  const changedEntries = useMemo(
    () => (item?.action === "UPDATE" ? getChangedEntries(item) : []),
    [item],
  );
  const requestedEntries = useMemo(
    () => (item ? getRequestedEntries(item) : []),
    [item],
  );

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <div className="mb-6 space-y-3">
          <Link
            href="/company/requests"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            요청 현황으로
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              요청 상세
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              제출한 변경 요청의 내용과 처리 상태를 확인합니다.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">요청 상세를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        ) : item ? (
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {formatScope(item.scope)} {formatAction(item.action)} 요청
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(item.status)}`}
                >
                  {formatStatus(item.status)}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">요청 ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">접수일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(item.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">처리일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {item.resolvedAt
                      ? new Date(item.resolvedAt).toLocaleString()
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    처리 메모
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {item.resolutionComment || "-"}
                  </dd>
                </div>
              </dl>
            </section>

            {item.action === "UPDATE" ? (
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                  <h2 className="text-sm font-semibold text-gray-900">
                    제출 시점 내용
                  </h2>
                  <dl className="mt-4 space-y-3">
                    {changedEntries.map((entry) => (
                      <div
                        key={`current-${entry.key}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <dt className="text-xs font-medium text-gray-500">
                          {entry.label}
                        </dt>
                        <dd className="text-right text-sm text-gray-900">
                          {entry.currentValue}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">
                    요청 내용
                  </h2>
                  <dl className="mt-4 space-y-3">
                    {changedEntries.map((entry) => (
                      <div
                        key={`requested-${entry.key}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <dt className="text-xs font-medium text-gray-500">
                          {entry.label}
                        </dt>
                        <dd className="text-right text-sm font-medium text-emerald-900">
                          {entry.requestedValue}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            ) : item.action === "CREATE" ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                <h2 className="text-sm font-semibold text-gray-900">
                  요청 내용
                </h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {requestedEntries.map((entry) => (
                    <div key={entry.key}>
                      <dt className="text-xs font-medium text-gray-500">
                        {entry.label}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {entry.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                <h2 className="text-sm font-semibold text-gray-900">
                  요청 내용
                </h2>
                <p className="mt-3 text-sm text-gray-700">
                  등록된 직원 삭제 요청입니다. 처리 전까지는 직원 목록과 상세
                  화면에서 현재 데이터가 유지됩니다.
                </p>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
