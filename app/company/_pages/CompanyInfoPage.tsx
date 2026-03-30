"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatBusinessNumber } from "@/app/lib/formatters";
import type { CompanyAuthMessageState } from "@/types/company/auth";
import type {
  CompanyMutationRequestResponse,
  PendingRequestSummary,
} from "@/types/company/change-request";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";
import DateInput from "@/app/_components/DateInput";
import type {
  CompanyInfoResponse,
  CompanyInfoUpdateBody,
} from "@/types/company/users";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

export default function CompanyOrganizationInfoPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [pendingRequest, setPendingRequest] =
    useState<PendingRequestSummary | null>(null);

  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<
    "INDIVIDUAL" | "CORPORATION"
  >("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: "",
    address: "",
    addressDetail: "",
  });

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
        setPendingRequest(data.pendingRequest);
        setBusinessNumber(formatBusinessNumber(data.company.businessNumber));
        setBusinessType(data.company.businessType);
        const source =
          data.pendingRequest &&
          typeof data.pendingRequest.requestedPayload === "object"
            ? (data.pendingRequest.requestedPayload as CompanyInfoUpdateBody)
            : data.company;
        setBusinessName(source.businessName || "");
        setRepresentativeName(source.representativeName || "");
        setOpeningDate(source.openingDate || "");
        setAddressValue({
          zipcode: source.zipcode || "",
          address: source.address || "",
          addressDetail: source.addressDetail || "",
        });
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
    if (!canManage || pendingRequest) return;

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
          zipcode: addressValue.zipcode,
          address: addressValue.address,
          addressDetail: addressValue.addressDetail,
        } satisfies CompanyInfoUpdateBody),
      });

      const body = (await res.json()) as
        | CompanyMutationRequestResponse
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

      const data = body as CompanyMutationRequestResponse;
      setPendingRequest(data.request);

      setMessage({
        type: "success",
        text: data.message,
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
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            회사 정보 관리
          </h1>
          <p className="text-sm text-gray-500">
            우리 회사 정보를 조회하고 변경 요청할 수 있습니다.
          </p>
          {!canManage && (
            <p className="mt-1 text-xs text-amber-700">
              마스터 사용자만 회사 정보를 수정할 수 있습니다.
            </p>
          )}
          {pendingRequest && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              세무대리인에게 회사 정보의 변경 요청이 접수되었습니다. 잠시만
              기다려주세요.
              <div className="mt-1 text-xs text-amber-700">
                접수일시 {new Date(pendingRequest.createdAt).toLocaleString()}
              </div>
            </div>
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
            <div
              className={`${readOnlyInputBase} rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-mono tracking-wide`}
            >
              {businessNumber || "-"}
            </div>
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
                disabled={!canManage || Boolean(pendingRequest)}
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
                disabled={!canManage || Boolean(pendingRequest)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              개업일
            </label>
            <DateInput
              value={openingDate}
              onChange={setOpeningDate}
              disabled={!canManage || Boolean(pendingRequest)}
              theme="emerald"
            />
          </div>

          <AddressInput
            value={addressValue}
            onChange={setAddressValue}
            disabled={!canManage || Boolean(pendingRequest)}
            theme="emerald"
          />

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
            disabled={loading || !canManage || Boolean(pendingRequest)}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading
              ? "요청 제출 중..."
              : pendingRequest
                ? "검수 대기 중"
                : "변경 요청"}
          </button>
          {pendingRequest && (
            <button
              type="button"
              onClick={() => router.push("/company/requests")}
              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              요청 현황 보기
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
