"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMessageState } from "@/types/company/auth";
import type {
  CompanyInfoResponse,
  CompanyInfoUpdateBody,
} from "@/types/company/users";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function CompanyOrganizationInfoPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<
    "INDIVIDUAL" | "CORPORATION"
  >("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [address, setAddress] = useState("");

  const [message, setMessage] = useState<CompanyAuthMessageState>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/company/auth/me", {
          cache: "no-store",
        });
        if (!meRes.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const me = (await meRes.json()) as { profileComplete?: boolean };
        if (!me.profileComplete) {
          router.replace("/company/auth/onboarding");
          return;
        }

        const res = await fetch("/api/company/info", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/company/auth/login");
          return;
        }

        const body = (await res.json()) as
          | CompanyInfoResponse
          | { error?: string };
        if (!res.ok) {
          setMessage({
            type: "error",
            text:
              (body as { error?: string }).error ||
              "회사 정보를 불러오지 못했습니다.",
          });
          return;
        }

        const data = body as CompanyInfoResponse;
        setCanManage(data.canManageCompanyInfo);
        setBusinessNumber(formatBusinessNumber(data.company.businessNumber));
        setBusinessType(data.company.businessType);
        setBusinessName(data.company.businessName || "");
        setRepresentativeName(data.company.representativeName || "");
        setOpeningDate(data.company.openingDate || "");
        setAddress(data.company.address || "");
      } catch {
        setMessage({
          type: "error",
          text: "회사 정보를 불러오지 못했습니다.",
        });
      } finally {
        setChecking(false);
      }
    };

    void load();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/company/info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          representativeName,
          openingDate,
          address,
        } satisfies CompanyInfoUpdateBody),
      });

      const body = (await res.json()) as
        | CompanyInfoResponse
        | { error?: string };
      if (!res.ok) {
        setMessage({
          type: "error",
          text:
            (body as { error?: string }).error ||
            "회사 정보 수정에 실패했습니다.",
        });
        return;
      }

      const data = body as CompanyInfoResponse;
      setCanManage(data.canManageCompanyInfo);
      setBusinessType(data.company.businessType);
      setBusinessName(data.company.businessName || "");
      setRepresentativeName(data.company.representativeName || "");
      setOpeningDate(data.company.openingDate || "");
      setAddress(data.company.address || "");

      setMessage({
        type: "success",
        text: "회사 정보가 수정되었습니다.",
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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            회사 정보 변경
          </h1>
          <p className="text-sm text-gray-500">
            사업자번호를 제외한 회사 정보를 수정할 수 있습니다.
          </p>
          {!canManage && (
            <p className="mt-1 text-xs text-amber-700">
              마스터 사용자만 회사 정보를 수정할 수 있습니다.
            </p>
          )}
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자번호
            </label>
            <input
              type="text"
              value={businessNumber}
              readOnly
              aria-readonly="true"
              className={`${inputBase} ${readOnlyInputBase} font-mono tracking-wide`}
            />
            <p className="mt-1 text-xs text-gray-400">
              사업자번호는 변경할 수 없습니다.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자구분
            </label>
            <div
              className={`${readOnlyInputBase} rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm`}
            >
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
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className={inputBase}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                대표자명
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={(event) => setRepresentativeName(event.target.value)}
                className={inputBase}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                개업일
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                maxLength={10}
                value={openingDate}
                onChange={(event) => {
                  const raw = event.target.value
                    .replace(/[^\d]/g, "")
                    .slice(0, 8);
                  let formatted = raw;
                  if (raw.length > 4)
                    formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
                  if (raw.length > 6)
                    formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
                  setOpeningDate(formatted);
                }}
                className={inputBase}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                주소
              </label>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={inputBase}
                disabled={!canManage}
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canManage}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
