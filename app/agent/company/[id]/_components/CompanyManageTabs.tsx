"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

function getTabs(companyId: string) {
  return [
    { href: `/agent/company/${companyId}/info`, label: "거래처 정보 관리" },
    { href: `/agent/company/${companyId}/users`, label: "거래처 사용자 관리" },
    {
      href: `/agent/company/${companyId}/salary-publication`,
      label: "급여 관리",
    },
    { href: `/agent/company/${companyId}/employee`, label: "직원 관리" },
    {
      href: `/agent/company/${companyId}/employee-publication`,
      label: "직원 발행 관리",
    },
  ] as const;
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function CompanyManageTabs() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const companyId = params?.id ?? "";

  const tabs = getTabs(companyId);

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        {tabs.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
