"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const TAB_ITEMS = [
  { slug: "info", label: "기본 정보" },
  { slug: "users", label: "거래처 사용자" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function CompanySettingsTabs() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const companyId = params?.id ?? "";

  return (
    <div className="sticky top-[6.25rem] z-10 border-b border-gray-600 bg-gray-700/95 backdrop-blur">
      <div className="mx-auto flex h-10 max-w-6xl items-center px-4 sm:px-6">
        <nav className="min-w-0 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1">
            {TAB_ITEMS.map((item) => {
              const href = `/agent/company/${companyId}/settings/${item.slug}`;
              const active = isActivePath(pathname, href);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
