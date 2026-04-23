"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatBusinessNumber } from "@/app/lib/formatters";
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
  "rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700";

type OrgFields = {
  organizationNumber: string;
  businessType: BusinessType;
  organizationName: string;
  representativeName: string;
  phone: string;
  openingDate: string;
  addressValue: AddressValue;
};

export default function AgentInfoPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [fields, setFields] = useState<OrgFields>({
    organizationNumber: "",
    businessType: "INDIVIDUAL",
    organizationName: "",
    representativeName: "",
    phone: "",
    openingDate: "",
    addressValue: { zipcode: "", address: "", addressDetail: "" },
  });
  const [editFields, setEditFields] = useState<OrgFields>(fields);

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

        if (!res.ok) throw new Error("조회 실패");

        const data = (await res.json()) as AgentOrganizationInfoResponse;

        setIsMaster(data.user.isMaster);

        const loaded: OrgFields = {
          organizationNumber: formatBusinessNumber(
            data.organization.organizationNumber,
          ),
          businessType: data.organization.businessType,
          organizationName: data.organization.organizationName || "",
          representativeName: data.organization.representativeName || "",
          phone: formatOrganizationPhone(data.organization.phone || ""),
          openingDate: data.organization.openingDate || "",
          addressValue: {
            zipcode: data.organization.zipcode || "",
            address: data.organization.address || "",
            addressDetail: data.organization.addressDetail || "",
          },
        };

        setFields(loaded);
        setEditFields(loaded);
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

  const handleEdit = () => {
    setEditFields(fields);
    setMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const phoneError = validateOrganizationPhone(editFields.phone);
    if (phoneError) {
      setMessage({ type: "error", text: phoneError });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/auth/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationNumber: editFields.organizationNumber,
          businessType: editFields.businessType,
          organizationName: editFields.organizationName || null,
          representativeName: editFields.representativeName || null,
          phone: editFields.phone || null,
          openingDate: editFields.openingDate || null,
          zipcode: editFields.addressValue.zipcode || null,
          address: editFields.addressValue.address || null,
          addressDetail: editFields.addressValue.addressDetail || null,
        } satisfies CreateOrganizationBody),
      });

      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "회사 정보 수정에 실패했습니다.",
        });
        return;
      }

      setFields(editFields);
      setMessage({ type: "success", text: "회사 정보가 수정되었습니다." });
      setIsEditing(false);
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const isBusinessNumberValid =
    editFields.organizationNumber.replace(/\D/g, "").length === 10;

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
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              회사 정보 관리
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "수정할 내용을 입력하고 저장하세요."
                : "회사 정보를 확인할 수 있습니다."}
            </p>
            {!isMaster && (
              <p className="mt-1 text-xs text-amber-600">
                회사 정보 수정은 마스터 권한이 필요합니다.
              </p>
            )}
          </div>

          {!isEditing && isMaster && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              수정하기
            </button>
          )}
        </div>

        {/* 메시지 (조회 모드에서만, 수정 성공 후 표시) */}
        {!isEditing && message && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 조회 모드 */}
        {!isEditing && (
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  사업자번호
                </p>
                <div
                  className={`${readOnlyDisplayBase} font-mono tracking-wide`}
                >
                  {fields.organizationNumber || "-"}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  사업자구분
                </p>
                <div className={readOnlyDisplayBase}>
                  {fields.businessType === "INDIVIDUAL" ? "개인" : "법인"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  상호명
                </p>
                <div className={readOnlyDisplayBase}>
                  {fields.organizationName || "-"}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  대표자명
                </p>
                <div className={readOnlyDisplayBase}>
                  {fields.representativeName || "-"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  대표 전화번호
                </p>
                <div className={readOnlyDisplayBase}>{fields.phone || "-"}</div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  개업일
                </p>
                <div className={readOnlyDisplayBase}>
                  {fields.openingDate || "-"}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">주소</p>
              <div className={readOnlyDisplayBase}>
                {fields.addressValue.address
                  ? `(${fields.addressValue.zipcode}) ${fields.addressValue.address}${fields.addressValue.addressDetail ? " " + fields.addressValue.addressDetail : ""}`
                  : "-"}
              </div>
            </div>
          </div>
        )}

        {/* 수정 모드 */}
        {isEditing && (
          <form
            className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-200"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  사업자번호
                </label>
                <div
                  className={`${readOnlyDisplayBase} font-mono tracking-wide`}
                >
                  {editFields.organizationNumber || "-"}
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
                  {editFields.businessType === "INDIVIDUAL" ? "개인" : "법인"}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  사업자번호에 따라 자동 설정됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  상호명
                </label>
                <input
                  type="text"
                  value={editFields.organizationName}
                  onChange={(e) =>
                    setEditFields((f) => ({
                      ...f,
                      organizationName: e.target.value,
                    }))
                  }
                  placeholder="상호명"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  대표자명
                </label>
                <input
                  type="text"
                  value={editFields.representativeName}
                  onChange={(e) =>
                    setEditFields((f) => ({
                      ...f,
                      representativeName: e.target.value,
                    }))
                  }
                  placeholder="홍길동"
                  className={inputBase}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                대표 전화번호
              </label>
              <input
                type="tel"
                value={editFields.phone}
                onChange={(e) =>
                  setEditFields((f) => ({
                    ...f,
                    phone: formatOrganizationPhone(e.target.value),
                  }))
                }
                placeholder="02-1234-5678"
                className={inputBase}
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
                value={editFields.openingDate}
                onChange={(v) =>
                  setEditFields((f) => ({ ...f, openingDate: v }))
                }
                theme="blue"
              />
            </div>

            <AddressInput
              value={editFields.addressValue}
              onChange={(v) =>
                setEditFields((f) => ({ ...f, addressValue: v }))
              }
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !isBusinessNumberValid}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
