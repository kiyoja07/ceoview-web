interface LoadingPanelProps {
  message?: string;
  className?: string;
}

export function LoadingPanel({
  message = "데이터를 불러오는 중…",
  className = "py-20",
}: LoadingPanelProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}
