"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBusinessNumber } from "@/app/lib/formatters";
import type { CompanyAuthMessageState } from "@/types/company/auth";
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

type EditableFields = {
  businessName: string;
  representativeName: string;
  openingDate: string;
  addressValue: AddressValue;
};

export default function CompanyOrganizationInfoPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [canManage, setCanManage] = useState(false);

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
  const [original, setOriginal] = useState<EditableFields>({
    businessName: "",
    representativeName: "",
    openingDate: "",
    addressValue: { zipcode: "", address: "", addressDetail: "" },
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
        setBusinessNumber(formatBusinessNumber(data.company.businessNumber));
        setBusinessType(data.company.businessType);

        const loadedFields: EditableFields = {
          businessName: data.company.businessName || "",
          representativeName: data.company.representativeName || "",
          openingDate: data.company.openingDate || "",
          addressValue: {
            zipcode: data.company.zipcode || "",
            address: data.company.address || "",
            addressDetail: data.company.addressDetail || "",
          },
        };

        setBusinessName(loadedFields.businessName);
        setRepresentativeName(loadedFields.representativeName);
        setOpeningDate(loadedFields.openingDate);
        setAddressValue(loadedFields.addressValue);
        setOriginal(loadedFields);
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

  const handleCancelEdit = () => {
    setBusinessName(original.businessName);
    setRepresentativeName(original.representativeName);
    setOpeningDate(original.openingDate);
    setAddressValue(original.addressValue);
    setMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: { preventDefault(): void }) => {
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
          zipcode: addressValue.zipcode,
          address: addressValue.address,
          addressDetail: addressValue.addressDetail,
        } satisfies CompanyInfoUpdateBody),
      });

      const body = (await res.json()) as
        | { message?: string }
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

      setIsEditing(false);
      const loadedFields: EditableFields = {
        businessName,
        representativeName,
        openingDate,
        addressValue,
      };
      setOriginal(loadedFields);
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
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  const canStartEdit = canManage;

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              회사 정보 관리
            </h1>
            <p className="text-sm text-gray-500">
              회사 정보를 조회하고 수정할 수 있습니다.
            </p>
            {!canManage && (
              <p className="mt-1 text-xs text-amber-700">
                마스터 사용자만 회사 정보를 수정할 수 있습니다.
              </p>
            )}
          </div>
          {!isEditing && canStartEdit && (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setIsEditing(true);
              }}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              수정
            </button>
          )}
        </div>

        {/* 성공 메시지는 조회 모드에서 표시 */}
        {!isEditing && message?.type === "success" && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message.text}
          </div>
        )}

        {isEditing ? (
          /* 편집 모드 */
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
                {businessNumber || "미등록"}
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
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  대표자명
                </label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={(event) =>
                    setRepresentativeName(event.target.value)
                  }
                  className={inputBase}
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
                theme="emerald"
              />
            </div>

            <AddressInput
              value={addressValue}
              onChange={setAddressValue}
              theme="emerald"
            />

            {message?.type === "error" && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message.text}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        ) : (
          /* 조회 모드 */
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <dl className="space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  사업자번호
                </dt>
                <dd className="text-right font-mono text-sm tracking-wide text-gray-900">
                  {businessNumber || "-"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  사업자구분
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {businessType === "INDIVIDUAL" ? "개인" : "법인"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  상호명
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {businessName || "미등록"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  대표자명
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {representativeName || "미등록"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  개업일
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {openingDate || "미등록"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  우편번호
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {addressValue.zipcode || "미등록"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  주소
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {addressValue.address || "미등록"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="min-w-28 text-sm font-medium text-gray-500">
                  상세주소
                </dt>
                <dd className="text-right text-sm text-gray-900">
                  {addressValue.addressDetail || "미등록"}
                </dd>
              </div>
            </dl>

          </div>
        )}
      </div>
    </div>
  );
}
