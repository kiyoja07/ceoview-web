"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ApiErrorResponse,
  AuthMessageState,
  CreateOrganizationBody,
} from "@/types/agent/auth";
import type { BusinessType } from "@/types/agent/company";
import type { AgentOrganizationInfoResponse } from "@/types/agent/organization";

interface BizStatusData {
  b_stt: string;
  b_stt_cd: string;
  tax_type: string;
  end_dt: string;
}

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function AgentInfoPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isMaster, setIsMaster] = useState(false);

  const [organizationNumber, setOrganizationNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL");
  const [organizationName, setOrganizationName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessageState>(null);

  const [bizValidating, setBizValidating] = useState(false);
  const [bizStatus, setBizStatus] = useState<BizStatusData | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const res = await fetch("/api/agent/auth/organization", {
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }

        if (res.status === 403 || res.status === 404) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (!res.ok) {
          throw new Error("조회 실패");
        }

        const data = (await res.json()) as AgentOrganizationInfoResponse;

        setIsMaster(data.user.isMaster);

        setOrganizationNumber(
          formatBusinessNumber(data.organization.organizationNumber),
        );
        setBusinessType(data.organization.businessType);
        setOrganizationName(data.organization.organizationName || "");
        setRepresentativeName(data.organization.representativeName || "");
        setOpeningDate(data.organization.openingDate || "");
        setAddress(data.organization.address || "");
      } catch {
        setMessage({
          type: "error",
          text: "조직 정보를 불러오지 못했습니다.",
        });
      } finally {
        setChecking(false);
      }
    };

    void loadOrganization();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/auth/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationNumber,
          businessType,
          organizationName: organizationName || null,
          representativeName: representativeName || null,
          openingDate: openingDate || null,
          address: address || null,
        } satisfies CreateOrganizationBody),
      });

      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "조직 정보 수정에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "조직 정보가 수정되었습니다.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isBusinessNumberValid =
    organizationNumber.replace(/\D/g, "").length === 10;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            조직 정보 변경
          </h1>
          <p className="text-sm text-gray-500">
            내 조직 정보를 조회하고 수정할 수 있습니다.
          </p>
          {!isMaster && !checking && (
            <p className="mt-1 text-xs text-amber-600">
              조직 정보 수정은 마스터 권한이 필요합니다.
            </p>
          )}
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={organizationNumber}
              onChange={(e) => {
                const formatted = formatBusinessNumber(e.target.value);
                setOrganizationNumber(formatted);
                setBizStatus(null);
                setBizError(null);
                const d = formatted.replace(/\D/g, "");
                if (d.length >= 5) {
                  const mid = Number(d.slice(3, 5));
                  setBusinessType(
                    mid >= 80 && mid <= 89 ? "CORPORATION" : "INDIVIDUAL",
                  );
                }
              }}
              placeholder="000-00-00000"
              className={`${inputBase} font-mono tracking-wide`}
              disabled={!isMaster}
            />
            {organizationNumber && !isBusinessNumberValid && (
              <p className="mt-1 text-xs text-amber-600">
                사업자번호 10자리를 입력해주세요.
              </p>
            )}

            {/* 국세청 조회 버튼 */}
            {isBusinessNumberValid && (
              <button
                type="button"
                onClick={async () => {
                  setBizValidating(true);
                  setBizStatus(null);
                  setBizError(null);
                  try {
                    const res = await fetch("/api/agent/company/validate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        businessNumber: organizationNumber,
                      }),
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      setBizError(err.error || "조회에 실패했습니다.");
                      return;
                    }
                    const data = await res.json();
                    setBizStatus(data as BizStatusData);
                  } catch {
                    setBizError("서버 연결에 실패했습니다.");
                  } finally {
                    setBizValidating(false);
                  }
                }}
                disabled={bizValidating}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bizValidating ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
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
                    조회 중...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                    국세청 조회
                  </>
                )}
              </button>
            )}

            {/* 국세청 조회 결과 */}
            {bizStatus && (
              <div
                className={`mt-2 rounded-lg border px-3 py-2.5 text-xs ${
                  bizStatus.b_stt_cd === "01"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : bizStatus.b_stt_cd === "02"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : bizStatus.b_stt_cd === "03"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-gray-200 bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {bizStatus.b_stt_cd === "01" && (
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  )}
                  {bizStatus.b_stt_cd === "02" && (
                    <svg
                      className="h-4 w-4 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                      />
                    </svg>
                  )}
                  {bizStatus.b_stt_cd === "03" && (
                    <svg
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  )}
                  납세자 상태: {bizStatus.b_stt || "알 수 없음"}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px] opacity-80">
                  <p>과세유형: {bizStatus.tax_type || "-"}</p>
                  {bizStatus.end_dt && (
                    <p>
                      폐업일:{" "}
                      {bizStatus.end_dt.replace(
                        /(\d{4})(\d{2})(\d{2})/,
                        "$1-$2-$3",
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 국세청 조회 에러 */}
            {bizError && (
              <p className="mt-1.5 text-xs text-red-600">{bizError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자구분
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700">
              {businessType === "INDIVIDUAL" ? "개인" : "법인"}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              사업자구분은 사업자번호에 따라 자동 설정됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                상호명
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="에이전트 상호명"
                className={inputBase}
                disabled={!isMaster}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                대표자명
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="홍길동"
                className={inputBase}
                disabled={!isMaster}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              개업일
            </label>
            <input
              type="date"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
              className={inputBase}
              disabled={!isMaster}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              주소
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="서울특별시 ..."
              className={inputBase}
              disabled={!isMaster}
            />
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isBusinessNumberValid || !isMaster}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "저장 중..." : "조직 정보 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
