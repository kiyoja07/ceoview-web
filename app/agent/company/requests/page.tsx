"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMMON_ACTION_LABELS } from "@/catalogs/ko/common";
import {
  buildChangeRequestStatusFilterOptions,
  CHANGE_REQUEST_ACTION_LABELS,
  CHANGE_REQUEST_COPY,
  CHANGE_REQUEST_SCOPE_LABELS,
  CHANGE_REQUEST_STATUS_BADGE_CLASSES,
  CHANGE_REQUEST_STATUS_LABELS,
} from "@/catalogs/ko/change-request";
import type {
  CompanyChangeRequestItem,
  CompanyChangeRequestListResponse,
} from "@/types/company/change-request";

function getRequestHref(item: CompanyChangeRequestItem) {
  if (item.scope === "COMPANY_INFO") {
    return `/agent/company/${item.companyId}/settings/info?requestId=${item.id}`;
  }
  if (item.action === "CREATE") {
    return `/agent/company/${item.companyId}/employees/new?requestId=${item.id}`;
  }
  return `/agent/company/${item.companyId}/employees/${item.targetEmployeeId}?requestId=${item.id}`;
}

export default function AgentCompanyRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CompanyChangeRequestItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  >("PENDING");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const statusQuery =
          statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
        const res = await fetch(`/api/agent/company/requests${statusQuery}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }
        const body = (await res.json()) as
          | CompanyChangeRequestListResponse
          | { error?: string };
        if (!res.ok) {
          throw new Error(
            ("error" in body ? body.error : undefined) ||
              CHANGE_REQUEST_COPY.agentList.loadError,
          );
        }
        const data = body as CompanyChangeRequestListResponse;
        setItems(data.items);
        setSummary(data.summary);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : CHANGE_REQUEST_COPY.agentList.loadError,
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router, statusFilter]);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {CHANGE_REQUEST_COPY.agentList.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {CHANGE_REQUEST_COPY.agentList.description}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {buildChangeRequestStatusFilterOptions(summary).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                statusFilter === item.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              {CHANGE_REQUEST_COPY.agentList.loading}
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              {CHANGE_REQUEST_COPY.agentList.empty}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">회사</th>
                    <th className="px-4 py-3">구분</th>
                    <th className="px-4 py-3">유형</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">요청자</th>
                    <th className="px-4 py-3">접수일</th>
                    <th className="px-4 py-3">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-900">
                        {item.company.businessName ||
                          item.company.businessNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {CHANGE_REQUEST_SCOPE_LABELS[item.scope]}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {CHANGE_REQUEST_ACTION_LABELS[item.action]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CHANGE_REQUEST_STATUS_BADGE_CLASSES[item.status]}`}
                        >
                          {CHANGE_REQUEST_STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.requestedByCompanyUser.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={getRequestHref(item)}
                          className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          {COMMON_ACTION_LABELS.open}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
