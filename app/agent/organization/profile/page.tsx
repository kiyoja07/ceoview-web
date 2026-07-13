"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/app/_components/ui/PageState";
import type {
  AgentAuthMeResponse,
  ApiErrorResponse,
  AuthMessageState,
} from "@/types/agent/auth";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";
import {
  formatCountdown,
  usePhoneVerification,
} from "@/app/_hooks/usePhoneVerification";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";
const readOnlyDisplayBase =
  "rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700";

export default function AgentProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [savedName, setSavedName] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [savedIsMaster, setSavedIsMaster] = useState(false);
  const [email, setEmail] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsMaster, setEditIsMaster] = useState(false);

  const [message, setMessage] = useState<AuthMessageState>(null);

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
    phone: editPhone,
    originalPhone: savedPhone,
    sendEndpoint: "/api/agent/auth/phone-verify/send",
    confirmEndpoint: "/api/agent/auth/phone-verify/confirm",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (!res.ok) throw new Error("조회 실패");

        const data = (await res.json()) as AgentAuthMeResponse;
        if (!data.hasOrganization) {
          router.replace("/agent/auth/organization");
          return;
        }

        setSavedName(data.name ?? "");
        setSavedPhone(data.phone ?? "");
        setSavedIsMaster(data.isMaster ?? false);
        setEmail(data.email ?? "");
        resetVerification();
      } catch {
        setMessage({ type: "error", text: "내 정보를 불러오지 못했습니다." });
      } finally {
        setChecking(false);
      }
    };

    void loadProfile();
  }, [resetVerification, router]);

  const handleEdit = () => {
    setEditName(savedName);
    setEditPhone(savedPhone);
    setEditIsMaster(savedIsMaster);
    setMessage(null);
    resetVerification();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setMessage(null);
    resetVerification();
    setIsEditing(false);
  };

  const handlePhoneChange = (value: string) => {
    setEditPhone(value);
    resetVerification();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const phoneError = validatePhone(editPhone);
    if (phoneError) {
      setMessage({ type: "error", text: phoneError });
      return;
    }

    if (needsVerification && !isPhoneVerified) {
      setMessage({
        type: "error",
        text: "변경된 휴대폰 번호의 인증을 완료해주세요.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const body = {
        name: editName,
        phone: editPhone || null,
        isMaster: editIsMaster,
        ...(needsVerification && isPhoneVerified && verificationId
          ? { phoneVerificationId: verificationId }
          : {}),
      };

      const res = await fetch("/api/agent/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      const data = (await res.json()) as ApiErrorResponse & {
        isMaster?: boolean;
      };

      if (!res.ok) {
        setEditIsMaster(savedIsMaster);
        setMessage({
          type: "error",
          text: data.error || "내 정보 저장에 실패했습니다.",
        });
        return;
      }

      const newIsMaster =
        typeof data.isMaster === "boolean" ? data.isMaster : editIsMaster;

      setSavedName(editName);
      setSavedPhone(editPhone);
      setSavedIsMaster(newIsMaster);
      setEditIsMaster(newIsMaster);
      resetVerification();

      setMessage({ type: "success", text: "내 정보가 수정되었습니다." });
      setIsEditing(false);
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return <PageLoading message="정보 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              내 정보
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "수정할 내용을 입력하고 저장하세요."
                : "내 계정 정보를 확인할 수 있습니다."}
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              수정하기
            </button>
          )}
        </div>

        {/* 조회 모드 메시지 (저장 성공 등) */}
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
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">이름</p>
              <div className={readOnlyDisplayBase}>{savedName || "-"}</div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">이메일</p>
              <div className={readOnlyDisplayBase}>{email || "-"}</div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                휴대폰 번호
              </p>
              <div className={readOnlyDisplayBase}>{savedPhone || "-"}</div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">권한</p>
              <div className={readOnlyDisplayBase}>
                {savedIsMaster ? "마스터" : "일반"}
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="홍길동"
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div
                className={`${readOnlyDisplayBase} cursor-not-allowed opacity-70`}
              >
                {email || "-"}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                이메일은 변경할 수 없습니다.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                휴대폰 번호
              </label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <PhoneInput
                    value={editPhone}
                    onChange={handlePhoneChange}
                    theme="blue"
                    disabled={
                      saving ||
                      verifyState === "sending" ||
                      verifyState === "verifying"
                    }
                  />
                </div>
                {needsVerification && !isPhoneVerified && (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={
                      saving ||
                      verifyState === "sending" ||
                      (verifyState === "sent" && countdown > 150)
                    }
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {verifyState === "sending"
                      ? "발송 중..."
                      : verifyState === "sent"
                        ? "재발송"
                        : "인증요청"}
                  </button>
                )}
                {isPhoneVerified && needsVerification && (
                  <div className="flex shrink-0 items-center rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
                    인증완료
                  </div>
                )}
              </div>

              {(verifyState === "sent" || verifyState === "verifying") && (
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) =>
                        setVerifyCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
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
                      saving ||
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
                      : "text-blue-600"
                  }`}
                >
                  {verifyMessage.text}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                권한
              </label>
              {editIsMaster ? (
                <select
                  value={editIsMaster ? "master" : "normal"}
                  onChange={(e) => setEditIsMaster(e.target.value === "master")}
                  className={inputBase}
                >
                  <option value="master">마스터</option>
                  <option value="normal">일반</option>
                </select>
              ) : (
                <div className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500">
                  일반
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {editIsMaster
                  ? "마스터 권한을 변경할 수 있습니다. 최소 1명의 마스터가 필요합니다."
                  : "권한은 마스터 사용자만 변경할 수 있습니다."}
              </p>
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || (needsVerification && !isPhoneVerified)}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
