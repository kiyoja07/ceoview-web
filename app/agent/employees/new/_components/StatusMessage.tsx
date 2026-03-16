import type { MessageState } from "@/types/agent/employee";

export function StatusMessage({ message }: { message: MessageState }) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        {message.type === "success" ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        )}
      </svg>
      <span className="whitespace-pre-line">{message.text}</span>
    </div>
  );
}
