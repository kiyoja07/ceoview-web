"use client";

import { useEffect } from "react";
import { PageError } from "@/app/_components/ui/PageState";

export default function Error({
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
    <PageError
      message="예상치 못한 문제가 발생했습니다."
      onRetry={reset}
    />
  );
}
