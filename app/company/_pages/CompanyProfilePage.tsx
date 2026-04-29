"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhoneInput } from "@/app/lib/formatters";
import type {
  CompanyAuthMeResponse,
  CompanyAuthMessageState,
  CompanyProfileUpdateBody,
} from "@/types/company/auth";
import {
  formatCountdown,
  usePhoneVerification,
} from "@/app/_hooks/usePhoneVerification";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

type OriginalValues = {
  name: string;
  phone: string;
  isMaster: boolean;
};

export default function CompanyOrganizationProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [original, setOriginal] = useState<OriginalValues>({
    name: "",
    phone: "",
    isMaster: false,
  });

  const [message, setMessage] = useState<CompanyAuthMessageState>(null);
  const {
    verifyState,
    verificationId,
    verifyCode,
    verifyMessage,
    countdown,
    needsVerification,
    isPhoneVerified,
    setVerifyCode,
    resetVerification,
    sendCode,
    confirmCode,
  } = usePhoneVerification({
    phone,
    originalPhone,
    sendEndpoint: "/api/company/auth/phone-verify/send",
    confirmEndpoint: "/api/company/auth/phone-verify/confirm",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as CompanyAuthMeResponse;
        if (!data.profileComplete) {
          router.replace("/company/auth/onboarding");
          return;
        }

        const loadedName = data.name ?? "";
        const loadedPhone = data.phone ?? "";
        const loadedIsMaster = data.isMaster;
        setName(loadedName);
        setPhone(loadedPhone);
        setOriginalPhone(loadedPhone);
        setEmail(data.email ?? "");
        setIsMaster(loadedIsMaster);
        setOriginal({ name: loadedName, phone: loadedPhone, isMaster: loadedIsMaster });
        resetVerification();
      } catch {
        router.replace("/company/auth/login");
      } finally {
        setChecking(false);
      }
    };

    void load();
  }, [resetVerification, router]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setPhone(formatted);
    resetVerification();
  };

  const handleCancelEdit = () => {
    setName(original.name);
    setPhone(original.phone);
    setIsMaster(original.isMaster);
    setOriginalPhone(original.phone);
    resetVerification();
    setMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault();

    if (needsVerification && !isPhoneVerified) {
      setMessage({
        type: "error",
        text: "변경된 휴대폰 번호의 인증을 완료해주세요.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const body: CompanyProfileUpdateBody = { name, phone, isMaster };

      if (needsVerification && isPhoneVerified && verificationId) {
        body.phoneVerificationId = verificationId;
      }

      const res = await fetch("/api/company/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string; isMaster?: boolean };
      if (!res.ok) {
        if (typeof data.isMaster === "boolean") {
          setIsMaster(data.isMaster);
        } else {
          setIsMaster(true);
        }
        setMessage({
          type: "error",
          text: data.error || "사용자 정보 변경에 실패했습니다.",
        });
        return;
      }

      const savedIsMaster = typeof data.isMaster === "boolean" ? data.isMaster : isMaster;
      setIsMaster(savedIsMaster);
      setOriginalPhone(phone);
      setOriginal({ name, phone, isMaster: savedIsMaster });
      resetVerification();
      setIsEditing(false);
      setMessage({
        type: "success",
        text: "내 정보가 수정되었습니다.",
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              내 정보 관리
            </h1>
            <p className="text-sm text-gray-500">
              내 정보를 조회하고 수정할 수 있습니다.
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => { setMessage(null); setIsEditing(true); }}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              수정
            </button>
          )}
        </div>

        {/* 성공 메시지는 뷰 모드에서도 표시 */}
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
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                휴대폰 번호
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  className={`${inputBase} ${isPhoneVerified && needsVerification ? "border-emerald-400 bg-emerald-50/50" : ""}`}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  readOnly={
                    verifyState === "sending" || verifyState === "verifying"
                  }
                />
                {needsVerification && !isPhoneVerified && (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={
                      verifyState === "sending" ||
                      (verifyState === "sent" && countdown > 150)
                    }
                    className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {verifyState === "sending"
                      ? "발송 중..."
                      : verifyState === "sent"
                        ? "재발송"
                        : "인증요청"}
                  </button>
                )}
                {isPhoneVerified && needsVerification && (
                  <div className="flex shrink-0 items-center rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                    ✓ 인증완료
                  </div>
                )}
              </div>

              {(verifyState === "sent" || verifyState === "verifying") && (
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(event) =>
                        setVerifyCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className={inputBase}
                      placeholder="인증번호 6자리"
                      maxLength={6}
                    />
                    {countdown > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-red-500">
                        {formatCountdown(countdown)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={confirmCode}
                    disabled={
                      verifyState === "verifying" ||
                      verifyCode.length < 6 ||
                      countdown === 0
                    }
                    className="shrink-0 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {verifyState === "verifying" ? "확인 중..." : "인증확인"}
                  </button>
                </div>
              )}

              {verifyMessage && (
                <p
                  className={`mt-1.5 text-xs ${
                    verifyMessage.type === "error"
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {verifyMessage.text}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                value={email}
                readOnly
                aria-readonly="true"
                className={`${inputBase} ${readOnlyInputBase}`}
              />
              <p className="mt-1 text-xs text-gray-400">
                이메일은 변경할 수 없습니다.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                권한
              </label>
              {isMaster ? (
                <select
                  value={isMaster ? "master" : "normal"}
                  onChange={(event) =>
                    setIsMaster(event.target.value === "master")
                  }
                  className={inputBase}
                >
                  <option value="master">마스터</option>
                  <option value="normal">일반</option>
                </select>
              ) : (
                <div
                  className={`${readOnlyInputBase} rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm`}
                >
                  일반
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {isMaster
                  ? "마스터 권한을 변경할 수 있습니다. 최소 1명의 마스터가 필요합니다."
                  : "권한은 마스터 사용자만 변경할 수 있습니다."}
              </p>
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
                disabled={loading || (needsVerification && !isPhoneVerified)}
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
                <dt className="min-w-24 text-sm font-medium text-gray-500">이름</dt>
                <dd className="text-right text-sm text-gray-900">{name || "-"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-24 text-sm font-medium text-gray-500">휴대폰 번호</dt>
                <dd className="text-right text-sm text-gray-900">{phone || "-"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <dt className="min-w-24 text-sm font-medium text-gray-500">이메일</dt>
                <dd className="text-right text-sm text-gray-900">{email || "-"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="min-w-24 text-sm font-medium text-gray-500">권한</dt>
                <dd className="text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isMaster
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isMaster ? "마스터" : "일반"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
