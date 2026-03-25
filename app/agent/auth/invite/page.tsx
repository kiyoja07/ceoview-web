"use client";

import { Suspense, useMemo, useState, type FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ApiErrorResponse } from "@/types/agent/auth";
import type {
  AcceptAgentInviteResponse,
  AgentInvitePreviewResponse,
} from "@/types/agent/invite";
import EmailInput, { validateEmail } from "@/app/_components/EmailInput";
import PhoneInput, { validatePhone } from "@/app/_components/PhoneInput";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

function formatOrganizationNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatExpireAt(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AgentInviteAcceptPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [previewLoading, setPreviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<AgentInvitePreviewResponse | null>(
    null,
  );

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToJoin, setAgreedToJoin] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const token = searchParams.get("token")?.trim() || "";

  useEffect(() => {
    const fetchPreview = async () => {
      if (!token) {
        setMessage({
          type: "error",
          text: "유효한 초대 링크가 아닙니다.",
        });
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);
      setMessage(null);

      try {
        const res = await fetch(
          `/api/agent/users/invite?token=${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          },
        );

        const data = (await res.json()) as
          | AgentInvitePreviewResponse
          | ApiErrorResponse;

        if (!res.ok) {
          const errorBody = data as ApiErrorResponse;
          setMessage({
            type: "error",
            text: errorBody.error || "초대 정보를 확인하지 못했습니다.",
          });
          setPreview(null);
          return;
        }

        setPreview(data as AgentInvitePreviewResponse);
      } catch {
        setMessage({
          type: "error",
          text: "초대 정보를 확인하지 못했습니다.",
        });
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    void fetchPreview();
  }, [token]);

  const submitLabel = useMemo(
    () => (submitting ? "가입 처리 중..." : "Agent 소속으로 가입하기"),
    [submitting],
  );

  const organizationLabel =
    preview?.organization.name ||
    (preview ? formatOrganizationNumber(preview.organization.number) : "");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setMessage({
        type: "error",
        text: "유효한 초대 링크가 아닙니다.",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setMessage({ type: "error", text: emailError });
      setSubmitting(false);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setMessage({ type: "error", text: phoneError });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/agent/users/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          name,
          phone,
          agreedToJoin,
        }),
      });

      const data = (await res.json()) as
        | AcceptAgentInviteResponse
        | ApiErrorResponse;

      if (!res.ok) {
        const errorBody = data as ApiErrorResponse;
        setMessage({
          type: "error",
          text: errorBody.error || "초대 수락에 실패했습니다.",
        });
        return;
      }

      const successBody = data as AcceptAgentInviteResponse;

      setMessage({
        type: "success",
        text: successBody.message || "가입이 완료되었습니다.",
      });

      router.replace(successBody.redirectTo || "/agent/company");
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto flex min-h-screen max-w-xl items-center p-6">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Agent 소속 초대 수락
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              초대받은 이메일을 입력하고 가입을 완료하세요.
            </p>
          </div>

          {previewLoading ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              초대 정보를 확인하는 중입니다...
            </div>
          ) : preview ? (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p>
                <strong>{organizationLabel}</strong> Agent 초대
              </p>
              <p className="mt-1 text-xs text-blue-700">
                초대자: {preview.inviter.name} ({preview.inviter.email})
              </p>
              <p className="mt-1 text-xs text-blue-700">
                초대 이메일: {preview.invitedEmailMasked}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                만료: {formatExpireAt(preview.expiresAt)}
              </p>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                초대받은 이메일 <span className="text-red-500">*</span>
              </label>
              <EmailInput
                value={email}
                onChange={setEmail}
                theme="blue"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                연락처
              </label>
              <PhoneInput value={phone} onChange={setPhone} theme="blue" />
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreedToJoin}
                onChange={(e) => setAgreedToJoin(e.target.checked)}
              />
              <span>
                본인은 위 Agent 소속 사용자로 가입하는 것에 동의합니다.
              </span>
            </label>

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
              disabled={previewLoading || !preview || submitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AgentInviteAcceptPage() {
  return (
    <Suspense>
      <AgentInviteAcceptPageInner />
    </Suspense>
  );
}
