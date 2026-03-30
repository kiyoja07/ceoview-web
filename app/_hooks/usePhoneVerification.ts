"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VerificationMessageState = {
  type: "error" | "success";
  text: string;
} | null;

export type PhoneVerifyState =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "verified";

type UsePhoneVerificationOptions = {
  phone: string;
  originalPhone: string;
  sendEndpoint: string;
  confirmEndpoint: string;
};

export function stripPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}:${remainSeconds.toString().padStart(2, "0")}`;
}

export function usePhoneVerification({
  phone,
  originalPhone,
  sendEndpoint,
  confirmEndpoint,
}: UsePhoneVerificationOptions) {
  const [verifyState, setVerifyState] = useState<PhoneVerifyState>("idle");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyMessage, setVerifyMessage] =
    useState<VerificationMessageState>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phoneChanged = stripPhone(phone) !== stripPhone(originalPhone);
  const phoneEmpty = stripPhone(phone).length === 0;
  const needsVerification = phoneChanged && !phoneEmpty;
  const isPhoneVerified = verifyState === "verified";

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

  const resetVerification = useCallback(() => {
    setVerifyState("idle");
    setVerificationId(null);
    setVerifyCode("");
    setVerifyMessage(null);
    setCountdown(0);
  }, []);

  const sendCode = async () => {
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
      const res = await fetch(sendEndpoint, {
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
      setCountdown(180);
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

  const confirmCode = async () => {
    if (!verificationId || !verifyCode.trim()) {
      setVerifyMessage({ type: "error", text: "인증번호를 입력해주세요." });
      return;
    }

    setVerifyState("verifying");
    setVerifyMessage(null);

    try {
      const res = await fetch(confirmEndpoint, {
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

  return {
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
  };
}
