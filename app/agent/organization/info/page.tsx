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
import DateInput from "@/app/_components/DateInput";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";
import {
  formatOrganizationPhone,
  validateOrganizationPhone,
} from "@/app/lib/organization-phone";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";
const readOnlyDisplayBase =
  "rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500";

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
  const [phone, setPhone] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: "",
    address: "",
    addressDetail: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessageState>(null);

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
        setPhone(formatOrganizationPhone(data.organization.phone || ""));
        setOpeningDate(data.organization.openingDate || "");
        setAddressValue({
          zipcode: data.organization.zipcode || "",
          address: data.organization.address || "",
          addressDetail: data.organization.addressDetail || "",
        });
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

    const phoneError = validateOrganizationPhone(phone);
    if (phoneError) {
      setMessage({
        type: "error",
        text: phoneError,
      });
      return;
    }

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
          phone: phone || null,
          openingDate: openingDate || null,
          zipcode: addressValue.zipcode || null,
          address: addressValue.address || null,
          addressDetail: addressValue.addressDetail || null,
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
            회사 정보 변경
          </h1>
          <p className="text-sm text-gray-500">
            내 회사 정보를 조회하고 수정할 수 있습니다.
          </p>
          {!isMaster && !checking && (
            <p className="mt-1 text-xs text-amber-600">
              회사 정보 수정은 마스터 권한이 필요합니다.
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
            <div className={`${readOnlyDisplayBase} font-mono tracking-wide`}>
              {organizationNumber || "-"}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              사업자번호는 변경할 수 없습니다.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자구분
            </label>
            <div className={readOnlyDisplayBase}>
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
              대표 전화번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(formatOrganizationPhone(event.target.value));
              }}
              placeholder="02-1234-5678"
              className={inputBase}
              disabled={!isMaster}
              maxLength={13}
            />
            <p className="mt-1 text-xs text-gray-400">
              거래처에게 담당 세무대리인 연락처로 표시됩니다.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              개업일
            </label>
            <DateInput
              value={openingDate}
              onChange={setOpeningDate}
              disabled={!isMaster}
              theme="blue"
            />
          </div>

          <AddressInput
            value={addressValue}
            onChange={setAddressValue}
            disabled={!isMaster}
            theme="blue"
          />

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
