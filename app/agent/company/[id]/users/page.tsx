"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ApiErrorResponse } from "@/types/agent/auth";
import type { AgentCompanyUsersResponse } from "@/types/agent/company";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

export default function AgentCompanyUsersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const companyId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentCompanyUsersResponse | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/agent/company/${companyId}/users`, {
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
          | AgentCompanyUsersResponse
          | ApiErrorResponse;

        if (!res.ok) {
          const errorBody = body as ApiErrorResponse;
          setError(errorBody.error || "거래처 사용자 조회에 실패했습니다.");
          setData(null);
          return;
        }

        setData(body as AgentCompanyUsersResponse);
      } catch {
        setError("거래처 사용자 조회에 실패했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [companyId, router]);

  const companyLabel = useMemo(() => {
    if (!data) return "";
    return (
      data.company.businessName ||
      formatBusinessNumber(data.company.businessNumber)
    );
  }, [data]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              거래처 사용자 관리
            </h1>
            {data && (
              <p className="mt-1 text-sm text-gray-500">
                {companyLabel} (
                {formatBusinessNumber(data.company.businessNumber)})
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              거래처 사용자 목록을 불러오는 중...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !data ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              사용자 정보를 확인할 수 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
              <p className="text-sm text-gray-600">총 {data.summary.total}명</p>
              <p className="mt-1 text-xs text-gray-500">
                활성 {data.summary.active} / 마스터 {data.summary.masters}
              </p>
            </div>

            {data.users.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                <p className="text-sm text-gray-500">
                  해당 거래처에 연결된 사용자가 없습니다.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        이름/이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        권한
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        연락처
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        가입일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.isMaster
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.isMaster ? "MASTER" : "MEMBER"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.isActive ? "활성" : "탈퇴"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {user.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
