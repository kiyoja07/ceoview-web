"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CompanyInviteContactType,
  SendCompanyUserInviteResponse,
} from "@/types/company/users";

type InviteCompanyUserModalProps = {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
};

export function InviteCompanyUserModal({
  open,
  onClose,
  onInvited,
}: InviteCompanyUserModalProps) {
  const [contactType, setContactType] =
    useState<CompanyInviteContactType>("email");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendCompanyUserInviteResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContact("");
      setError(null);
      setResult(null);
      setSending(false);
      setCopied(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = contact.trim();
      if (!trimmed) {
        setError(
          contactType === "email"
            ? "이메일을 입력해주세요."
            : "전화번호를 입력해주세요.",
        );
        return;
      }

      setSending(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/company/users/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactType,
            contact: trimmed,
          }),
        });

        const body = (await res.json()) as SendCompanyUserInviteResponse & {
          error?: string;
        };

        if (!res.ok) {
          setError(body.error || "초대에 실패했습니다.");
          return;
        }

        setResult(body);
        onInvited();
      } catch {
        setError("초대 요청 중 오류가 발생했습니다.");
      } finally {
        setSending(false);
      }
    },
    [contact, contactType, onInvited],
  );

  const handleCopy = useCallback(async () => {
    if (!result?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = result.inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-950/5">
        <h2 className="text-lg font-bold text-gray-900">소속 사용자 초대</h2>
        <p className="mt-1 text-sm text-gray-500">
          이메일 또는 전화번호로 회계 담당자를 초대할 수 있습니다.
        </p>

        {result ? (
          <div className="mt-5">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {result.message}
            </div>

            {result.inviteUrl && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  초대 링크
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={result.inviteUrl}
                    className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                  >
                    {copied ? "복사됨!" : "복사"}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  전화번호 사용자에게 직접 전달해주세요.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setContact("");
                  setError(null);
                  setCopied(false);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                추가 초대
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                초대 방식
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactType("email");
                    setContact("");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    contactType === "email"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  이메일
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContactType("phone");
                    setContact("");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    contactType === "phone"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  전화번호
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="invite-contact"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                {contactType === "email" ? "이메일 주소" : "전화번호"}
              </label>
              <input
                ref={inputRef}
                id="invite-contact"
                type={contactType === "email" ? "email" : "tel"}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={
                  contactType === "email" ? "user@example.com" : "010-0000-0000"
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={sending}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? "처리 중..." : "초대하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
