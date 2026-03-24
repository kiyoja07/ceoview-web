"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CHANGE_REQUEST_COPY } from "@/catalogs/ko/change-request";
import {
  CHANGE_REQUEST_ACTION_LABELS,
  CHANGE_REQUEST_DETAIL_FIELD_LABELS,
  CHANGE_REQUEST_SCOPE_LABELS,
  CHANGE_REQUEST_STATUS_BADGE_CLASSES,
  CHANGE_REQUEST_STATUS_LABELS,
} from "@/catalogs/ko/change-request";
import type {
  CompanyChangeRequestDetailResponse,
  CompanyChangeRequestItem,
} from "@/types/company/change-request";

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

  return CHANGE_REQUEST_DETAIL_FIELD_LABELS.map(({ key, label }) => {
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

  return CHANGE_REQUEST_DETAIL_FIELD_LABELS.map(({ key, label }) => ({
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
              CHANGE_REQUEST_COPY.detail.loadError,
          );
        }
        setItem((body as CompanyChangeRequestDetailResponse).item);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : CHANGE_REQUEST_COPY.detail.loadError,
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
            {CHANGE_REQUEST_COPY.companyList.back}
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {CHANGE_REQUEST_COPY.detail.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {CHANGE_REQUEST_COPY.detail.description}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              {CHANGE_REQUEST_COPY.detail.loading}
            </p>
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
                  {CHANGE_REQUEST_SCOPE_LABELS[item.scope]}{" "}
                  {CHANGE_REQUEST_ACTION_LABELS[item.action]} 요청
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CHANGE_REQUEST_STATUS_BADGE_CLASSES[item.status]}`}
                >
                  {CHANGE_REQUEST_STATUS_LABELS[item.status]}
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
