"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatBusinessNumber } from "@/app/lib/formatters";
import { AGENT_COMPANY_MANAGE_TABS } from "@/catalogs/ko/navigation";

type CompanyInfo = {
  businessName: string | null;
  businessNumber: string;
};

function isActivePath(pathname: string, href: string) {
  if (/^\/agent\/company\/[^/]+$/.test(href)) {
    return pathname === href;
  }

  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function CompanyManageTabs() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const companyId = params?.id ?? "";
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/agent/company/${companyId}/info`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as CompanyInfo;
        if (!cancelled) setCompany(data);
      } catch {
        // ignore
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const tabs = useMemo(
    () =>
      AGENT_COMPANY_MANAGE_TABS.map((item) => ({
        ...item,
        href:
          item.slug === "overview"
            ? `/agent/company/${companyId}`
            : item.slug === "settings"
              ? `/agent/company/${companyId}/settings/info`
              : item.slug === "financial-report"
                ? `/agent/company/${companyId}/financial-report/generate`
                : `/agent/company/${companyId}/${item.slug}`,
      })),
    [companyId],
  );

  const companyLabel = company
    ? company.businessName || formatBusinessNumber(company.businessNumber)
    : `거래처 ${companyId}`;

  return (
    <div className="sticky top-14 z-20 border-b border-gray-700 bg-gray-800/95 backdrop-blur">
      <div className="mx-auto flex h-11 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-1.5 text-sm">
          <Link
            href="/agent/company"
            className="text-gray-400 transition hover:text-white"
          >
            거래처
          </Link>
          <span className="text-gray-500">/</span>
          <span className="font-medium text-white">{companyLabel}</span>
        </div>

        <nav className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1">
            {tabs.map((item) => {
              const active =
                item.label === "설정"
                  ? pathname.startsWith(`/agent/company/${companyId}/settings`)
                  : item.label === "재무리포트"
                    ? pathname.startsWith(
                        `/agent/company/${companyId}/financial-report`,
                      )
                    : isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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
