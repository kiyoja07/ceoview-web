import Link from "next/link";
import type { ReactNode } from "react";

type QuickActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export function QuickActionCard({
  href,
  title,
  description,
  icon,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <svg
              className="h-4 w-4 text-gray-300 transition group-hover:text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
            </svg>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
