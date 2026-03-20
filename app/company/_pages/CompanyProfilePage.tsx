"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  CompanyAuthMeResponse,
  CompanyAuthMessageState,
  CompanyProfileUpdateBody,
} from "@/types/company/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function stripPhone(value: string) {
  return value.replace(/\D/g, "");
}

type PhoneVerifyState = "idle" | "sending" | "sent" | "verifying" | "verified";

export default function CompanyOrganizationProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [message, setMessage] = useState<CompanyAuthMessageState>(null);

  // 휴대폰 인증 관련 상태
  const [verifyState, setVerifyState] = useState<PhoneVerifyState>("idle");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyMessage, setVerifyMessage] =
    useState<CompanyAuthMessageState>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phoneChanged = stripPhone(phone) !== stripPhone(originalPhone);
  const phoneEmpty = stripPhone(phone).length === 0;
  const needsVerification = phoneChanged && !phoneEmpty;
  const isPhoneVerified = verifyState === "verified";

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown]);

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

        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setOriginalPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setIsMaster(data.isMaster);
      } catch {
        router.replace("/company/auth/login");
      } finally {
        setChecking(false);
      }
    };

    void load();
  }, [router]);

  // 휴대폰 번호가 변경되면 인증 상태 초기화
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    // 번호가 바뀌면 인증 초기화
    setVerifyState("idle");
    setVerificationId(null);
    setVerifyCode("");
    setVerifyMessage(null);
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    const digits = stripPhone(phone);
    if (digits.length < 10) {
      setVerifyMessage({
        type: "error",
        text: "올바른 휴대폰 번호를 입력해주세요.",
      });
      return;
    }

    setVerifyState("sending");
    setVerifyMessage(null);

    try {
      const res = await fetch("/api/company/auth/phone-verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        verificationId?: string;
        error?: string;
      };

      if (!res.ok) {
        setVerifyState("idle");
        setVerifyMessage({
          type: "error",
          text: data.error || "인증번호 발송에 실패했습니다.",
        });
        return;
      }

      setVerificationId(data.verificationId ?? null);
      setVerifyState("sent");
      setVerifyCode("");
      setCountdown(180); // 3분
      setVerifyMessage({
        type: "success",
        text: "인증번호가 발송되었습니다.",
      });
    } catch {
      setVerifyState("idle");
      setVerifyMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    }
  };

  // 인증번호 확인
  const handleConfirmCode = async () => {
    if (!verificationId || !verifyCode.trim()) {
      setVerifyMessage({ type: "error", text: "인증번호를 입력해주세요." });
      return;
    }

    setVerifyState("verifying");
    setVerifyMessage(null);

    try {
      const res = await fetch("/api/company/auth/phone-verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          code: verifyCode.trim(),
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        verified?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setVerifyState("sent");
        setVerifyMessage({
          type: "error",
          text: data.error || "인증 확인에 실패했습니다.",
        });
        return;
      }

      setVerifyState("verified");
      setCountdown(0);
      setVerifyMessage({
        type: "success",
        text: "휴대폰 인증이 완료되었습니다.",
      });
    } catch {
      setVerifyState("sent");
      setVerifyMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 휴대폰 번호가 변경되었는데 인증이 안 된 경우
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
      const body: CompanyProfileUpdateBody = {
        name,
        phone,
        isMaster,
      };

      // 인증 완료된 경우에만 verificationId 전달
      if (needsVerification && isPhoneVerified && verificationId) {
        body.phoneVerificationId = verificationId;
      }

      const res = await fetch("/api/company/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        error?: string;
        isMaster?: boolean;
      };
      if (!res.ok) {
        // 권한 변경 실패 시 서버 상태로 롤백
        if (typeof data.isMaster === "boolean") {
          setIsMaster(data.isMaster);
        } else {
          // 서버에서 isMaster 미반환 시, 마스터 관련 에러면 마스터로 복원
          setIsMaster(true);
        }
        setMessage({
          type: "error",
          text: data.error || "사용자 정보 변경에 실패했습니다.",
        });
        return;
      }

      // 저장 성공 시 서버 응답으로 isMaster 동기화
      if (typeof data.isMaster === "boolean") {
        setIsMaster(data.isMaster);
      }

      // 저장 성공 시 원래 번호 업데이트, 인증 상태 초기화
      setOriginalPhone(phone);
      setVerifyState("idle");
      setVerificationId(null);
      setVerifyCode("");
      setVerifyMessage(null);

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

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
            내 정보 관리
          </h1>
          <p className="text-sm text-gray-500">
            내 정보를 조회하고 수정할 수 있습니다.
          </p>
        </div>

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

          {/* 휴대폰 번호 + 인증 */}
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
                  onClick={handleSendCode}
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

            {/* 인증번호 입력 필드 */}
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
                  onClick={handleConfirmCode}
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

            {/* 인증 관련 메시지 */}
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
              이메일은 조회만 가능하며 변경할 수 없습니다.
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

          <button
            type="submit"
            disabled={loading || (needsVerification && !isPhoneVerified)}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
