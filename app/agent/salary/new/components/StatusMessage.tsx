import type { MessageState } from "../types";

type Props = {
  message: MessageState;
};

export function StatusMessage({ message }: Props) {
  if (!message) return null;

  return (
    <div
      className={`text-sm px-3 py-2 rounded-md ${
        message.type === "success"
          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {message.text}
    </div>
  );
}
