"use client";

import { useEffect } from "react";
import { PageError } from "@/app/_components/ui/PageState";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-app-bg">
        <PageError
          message="예상치 못한 문제가 발생했습니다."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
