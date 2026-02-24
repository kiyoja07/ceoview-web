import type { UsersMessageState } from "@/types/agent/users";

type StatusMessageProps = {
  message: UsersMessageState;
};

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-6 rounded-xl px-4 py-3 text-sm ${
        message.type === "error"
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {message.text}
    </div>
  );
}
