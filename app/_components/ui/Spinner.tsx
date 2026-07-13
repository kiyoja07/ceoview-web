export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="로딩 중"
      className={`animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600 ${className}`}
    />
  );
}
