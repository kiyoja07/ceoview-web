"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY_MANAGE_TABS } from "@/catalogs/ko/navigation";

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function CompanyManageTabs() {
  const pathname = usePathname();
  const tabItems = COMPANY_MANAGE_TABS.filter(
    (item): item is typeof item & { href: string } =>
      typeof item.href === "string",
  );

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        {tabItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-100 text-emerald-700"
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
